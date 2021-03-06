import { IWalletBase } from '../store/wallets/types'
import { sendTx as sendEth } from './eth/eth'
import { sendTx as sendEos } from './eos'

export const sendTx = (tx: string, wallet: IWalletBase) => {
  switch (wallet.blockchain) {
    case 'eth':
      return sendEth(wallet, tx)
    case 'eos':
      return sendEos(wallet, tx)

    default:
      return null
  }
}
