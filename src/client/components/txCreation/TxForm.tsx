import React from 'react'
import { defaultProps } from 'recompact'
import { Form } from 'react-powerplug'
import { navigate } from 'fuse-react'
import web3 from 'web3'
import { Column, Row, Centered } from '../shared/layout'
import { H2 } from '../shared/typography'
import { TextInput } from '../shared/inputs'
import { ButtonBase } from '../shared/buttons'
import { RTCHelper } from '../../services/webrtc';
import { IWallet } from '../../model';
import { signTransferTx } from '../../helpers/webrtc'

interface ITxFormProps {
  blockChainPrice?: string
  blockChainData?: {
    avgWait: string,
  }
  address: string
  value: any
  set: (data: any) => void,
  webrtc: RTCHelper,
  wallet: IWallet,
  isSending: boolean
}

const TxForm = ({ address, blockChainPrice, blockChainData, value, set, webrtc, wallet, isSending }: ITxFormProps) => {

  if(isSending) {
    return (
      <Row style={{ minWidth: '80vw' }}>
        <H2>Sending...</H2>
      </Row>
    )
  }

  return(
    <Form initial={value} >
      {({ input, values }) => (
        <form onSubmit={(e) => {
          e.preventDefault()

          if(webrtc.connected) {
            webrtc.dataChannel.send(signTransferTx(values, wallet))
            return
          }

          set(values)
          navigate(`/txCreation/ftm/${address}/sign`)
        }}>
          <Column>
            <TextInput placeholder={`To address`} {...input('to').bind} />
            <Row>
              <TextInput type="number" min="0" step={1e-18.toFixed(20)} placeholder='Amount' {...input('amount').bind} />
              <Centered style={{display: 'flex', marginLeft: '.5rem'}}>
                <span>~{(Number(values.amount) * Number(blockChainPrice)).toFixed(2)}$</span>
              </Centered>
            </Row>
            <Row>
              <span>Gas price {values.gasPrice} GWEI</span>
              <TextInput type='range' {...input('gasPrice').bind} min='1' max='100' />
              <span> {(Number(web3.utils.fromWei(values.gasPrice, "gwei")) * 21000 * Number(blockChainPrice)).toFixed(3)} USD</span>
              <span style={{minWidth: '5rem', marginLeft: '.5rem'}}> {`< ${(Number(blockChainData.avgWait) * Number(values.gasPrice)).toFixed(2)} min`}</span>
            </Row>
            <ButtonBase type='submit'>Sign</ButtonBase>
          </Column>
        </form>
      )}
    </Form>
  )
}
export default defaultProps({ blockChainPrice: 0, blockChainData: { avgWait: 1 } })(TxForm)
