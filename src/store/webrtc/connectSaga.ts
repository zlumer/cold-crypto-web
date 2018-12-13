import { call, take, put, cancelled, select, race } from 'redux-saga/effects'
import { eventChannel } from 'redux-saga'

import { handshakeServerUrl } from '../../constants'
import { connectionReady, sendCommand, setSender } from './actions'
import { getWalletListCommand } from '../../helpers/jsonrps'
import { setRtcSid } from '../transport/actions'
import { IApplicationState } from '..'
import { RTCHelper } from '../../helpers/webrtc/webrtc'

const makeOfferRequest = (offer: string) =>
  JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'offer', params: { offer } })

const makeIceRequest = (ice: RTCIceCandidate) =>
  JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'ice', params: { ice } })

const onOpenChannel = (ws: WebSocket) =>
  eventChannel(emit => {
    ws.addEventListener('open', emit)
    ws.addEventListener('error', err => emit(err))
    return () => ws.removeEventListener('open', emit)
  })

const onWsFallbackChannel = (ws: WebSocket) =>
  eventChannel(emit => {
    ws.addEventListener('fallback', emit)
    return () => ws.removeEventListener('fallback', emit)
  })

const onRtcConnectFailedChannel = (rtc: RTCHelper) =>
  eventChannel(emit => {
    rtc.on('error', err => emit(err))
    rtc.on('close', err => emit(err))
    return () => false
  })

const onRtcConnectedChannel = (rtc: RTCHelper) =>
  eventChannel(emit => {
    rtc.on('connected', err => emit(err))
    return () => false
  })

const onRtcMessageChannel = (rtc: RTCHelper) =>
  eventChannel(emit => {
    rtc.on('msg', err => emit(err))
    return () => false
  })

function* answerSaga(ws: WebSocket, rtc: RTCHelper, answer: string) {
  const sendIce = (ice: RTCIceCandidate) => ws.send(makeIceRequest(ice)) // TODO: Add typings
  rtc.candidates.map(sendIce)
  rtc.on('ice', sendIce)
  yield call(rtc.pushAnswer, { type: 'answer' as RTCSdpType, sdp: answer })
  yield call(rtc.waitConnection)
  yield put(connectionReady())
  return ws.close()
}

const makeWsSender = (ws: WebSocket) => (msg: string | object /* TODO: add type */) =>
  ws.send(typeof msg === 'string' ? msg : JSON.stringify({
    jsonrpc: '2.0',
    id: 789,
    method: 'fallback',
    params: { msg }
  }))


export default function* connectSaga() {
  const rtc = yield select((state: IApplicationState) => state.webrtc.rtc)
  const offerPromise = yield call(rtc.createOffer)
  const ws = new WebSocket(handshakeServerUrl)
  const openChan = onOpenChannel(ws)
  yield take(openChan)

  const send = makeWsSender(ws)

  send(makeOfferRequest(offerPromise.sdp))

  const rtcConnectedChan = onRtcConnectedChannel(rtc)
  const rtcConnectFailedChan = onRtcConnectFailedChannel(rtc)
  const rtcMessageChan = onRtcMessageChannel(rtc)
  const wsFallbackChan = onWsFallbackChannel(ws)

  const [ rtcConnected ] = yield race([
    take(rtcConnectedChan),
    take(rtcConnectFailedChan)
  ] as any /* TODO: update types of reduc-saga */)

  // yield fork(watchForWsClose(ws)) TODO: implement for catch future disconnections

  const msgChan = rtcConnected ? rtcMessageChan : wsFallbackChan

  while (true)
    try {
      const { data } = yield take(msgChan)
      const { id, method, result, params } = JSON.parse(data.toString())

      if (id === 1) yield put(setRtcSid(webrtcLogin(result.sid)))
      if (method === 'ice') yield call(rtc.pushIceCandidate, params.ice)
      if (method === 'answer')
        return yield call(answerSaga, ws, rtc, params.answer)
    } catch (err) {
      console.log(err)
    } finally {
      if (yield cancelled()) {
        openChan.close()
        msgChan.close()
        console.log('ws connection closed')
        yield put(sendCommand(getWalletListCommand()))
      }
    }
}

export const webrtcLogin = (sid: string) => {
  const params = { sid, url: handshakeServerUrl }

  return `webrtcLogin|1|${JSON.stringify(params)}`
}
