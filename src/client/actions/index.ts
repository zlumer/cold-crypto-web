import { createAction } from 'redux-act'

export const setQr = createAction<{ key: string; value: string }>('set qr')
export const generateQr = createAction<{ key: string; value: string }>('generate qr')
export const setQrScanned = createAction<string | Error>('set qr scanned')
export const setQrCode = createAction<string>('set qr code')
export const addWallets = createAction<any[] | Error>('add wallets')
export const scanWallets = createAction<any[] | Error>('scan wallets')
export const scanTransaction = createAction<any | Error>('scan transaction')
export const startSendingTx = createAction<boolean>('start transaction')

export const scanAnswer = createAction<RTCSessionDescriptionInit | Error>('scan answer')
export const initWebrtcConnaction = createAction('success rtc connection')
export const webrtcMessageReceived = createAction<string>('message received')
export const setLastTransaction = createAction<any | Error>('set last transaction')

export const setPayData = createAction<any>('set pay data')

export const setBlockchainGasInfo = createAction<{ key: string, value: object }>('set blockchain gas info')
export const setBlockchainTicker = createAction<{ key: string, value: object }>('set blockchain ticker')
