import { eventChannel } from 'redux-saga'
import { call, put, take, takeEvery, all, select, fork } from 'redux-saga/effects'
import { push } from 'connected-react-router'
import { parseMessage, parseJsonString } from '../helpers/json'
import { signTransferTx, signContractCall } from '../helpers/webrtc'
import { getNonce, sendTx } from '../services/ethHelper'
import { RTCCommands } from '../constants'
import WebRTC from '../services/webrtc'
import { IWallet } from '../reducers/walletReducer'

import {
  addWallets,
  ITxSignFormData,
  scanTransaction,
  scanWallets,
  setLastTransaction,
  setScanResult,
  setSignedData,
  setTransactionError,
  signTxRequest,
  webrtcMessageReceived,
  signContractRequest,
  IContractSignFormData,
} from '../actions'

function* createEventChannel(rtc) {
  return eventChannel((emit) => {
    rtc.dataChannel.onmessage = (message) => emit(message.data)
    return () => rtc.close()
  })
}

function makeWebrtcChannelSaga(webrtc: typeof WebRTC) {
  return function* webrtcChannelSaga() {
    const channel = yield call(createEventChannel, webrtc)
    while (true) {
      const message = yield take(channel)
      const { id, result } = parseMessage(message)

      switch (id) {
        case RTCCommands.getWalletList:
          yield setWallet(result)
          break
        case RTCCommands.signTransferTx:
          yield put(scanTransaction(result))
          break
        default:
          break
      }
    }
  }
}

function* setWallet(wallet) {
  const wallets = yield all(wallet.map((item) =>
    getNonce(item.address).then((resolve) =>
      ({ ...item, nonce: resolve }))))

  yield put(addWallets(wallets))

  if (wallets.length === 1) {
    const payData = yield select((state: any) => state.wallet.payData)
    const rootPagePath = Object.keys(payData).length ? 'txCreation' : 'wallet'
    const [ { blockchain, address } ] = wallet

    yield put(push(`/${rootPagePath}/${blockchain}/${address}`))
  } else
    yield put(push('/wallets'))
}

function* webrtcListener(action) {
  const data = parseMessage(action.payload)

  switch (data.id) {
    case RTCCommands.getWalletList:
      yield setWallet(data.result)
      break
    case RTCCommands.signTransferTx:
      yield put(scanTransaction(data.result))
      break
    default:
      break
  }
}

function* complementWallets(action) {
  // TODO: make notification about not valid qrcode
  if (!action.payload.length) return

  yield setWallet(action.payload)
}

function* waitForScanResults() {
  while (true) try {
    const { payload } = yield take(setScanResult)
    if (payload instanceof Error) throw payload

    const signedTx = parseJsonString(payload.substr(3))
    const txHash = yield call(sendTx, signedTx)

    // Pass a tx hash to a view
    yield put(setLastTransaction(txHash))
    yield put(push('/tx'))
    return // exit from loop if successed
  } catch (err) {
    yield put(setTransactionError(err))
    yield put(push('error'))
    // Don't use statement `return` because we will go out from the loop and can't handle other one.
  }
}

function makeTxSignRequestSaga(webrtc: typeof WebRTC) {
  return function* waitForTxSignRequestSaga() {
    while (true) {
      // Wait for action in a loop
      type SignTxRequestPayload = { payload: { data: ITxSignFormData, wallet: IWallet } }
      const { payload: { data, wallet } }: SignTxRequestPayload = yield take(signTxRequest)
      const signedData = signTransferTx(data, wallet)

      // Pass to react to render as qr code
      yield put(setSignedData(signedData))

      // if (webrtc.connected) webrtc.dataChannel.send(signedData)
      // else throw Error('WebRTC is not connected') // TODO: handle it?

      const { blockchain, address } = wallet
      yield put(push(`/txCreation/${blockchain}/${address}/sign`))

      // Waiting for a qr scan result
      // Enable multiple attempts by fork a loop
      yield fork(waitForScanResults) // Maybe need to pass some key or props?
    }
  }
}

function makeContractSignRequestSaga() {
  return function* waitForContractSignRequestSaga() {
    while (true) {
      // Wait for action in a loop
      type SignContractRequestPayload = { payload: { data: IContractSignFormData, wallet: IWallet } }
      const { payload: { data, wallet} }: SignContractRequestPayload  = yield take(signContractRequest)
      const signedData = signContractCall(data, wallet)
      console.log(signedData)
      // // Pass to react to render as qr code
      yield put(setSignedData(signedData))

      // // if (webrtc.connected) webrtc.dataChannel.send(signedData)
      // // else throw Error('WebRTC is not connected') // TODO: handle it?

      const { blockchain, address } = wallet
      yield put(push(`/txCreation/${blockchain}/${address}/sign`))

      // Waiting for a qr scan result
      // Enable multiple attempts by fork a loop
      yield fork(waitForScanResults) // Maybe need to pass some key or props?
    }
  }
}

export default function* rootSaga() {
  const webrtc = WebRTC // new WebRTC()

  yield all([
    takeEvery(scanWallets, complementWallets),
    takeEvery(webrtcMessageReceived, webrtcListener),
    // fork(makeWebrtcChannelSaga(webrtc)),
    fork(makeTxSignRequestSaga(webrtc)),
    fork(makeContractSignRequestSaga()),
  ])
}
