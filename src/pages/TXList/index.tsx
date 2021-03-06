import * as React from 'react'
import { IWalletBase, IWalletEth } from '../../store/wallets/types'

import { EthTx } from './eth'
import { EosTX } from './eos'

interface IProps {
  wallet: IWalletBase | IWalletEth
}

export const TXList: React.SFC<IProps> = ({ wallet }) => {
  if (!wallet.txs) return <div />

  if (wallet.blockchain === 'eth') {
    return EthTx(wallet as IWalletEth)
  }

  if (wallet.blockchain === 'eos') {
    return EosTX(wallet.txs)
  }

  return <div>hi</div>
}
