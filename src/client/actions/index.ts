import { createAction } from 'redux-act'

import { IWallet } from '../reducers/wallet'

export const setQr = createAction<{ key: string; value: string }>('set qr')
export const generateQr = createAction<{ key: string; value: string }>('generate qr')
export const setQrScanned = createAction<string | Error>('set qr scanned')
export const setQrCode = createAction<string>('set qr code')
export const addWallets = createAction<IWallet[] | Error>('add wallets')
