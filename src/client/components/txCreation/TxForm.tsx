import React from 'react'
import { defaultProps } from 'recompact'
import { Form } from 'react-powerplug'
import { navigate } from 'fuse-react'

import { Column, Row } from '../layout'

interface TxFormProps {
  blockChainPrice?: string
  blockChainData?: {
    avgWait: string
  }
  address: string
  value: any
  set: (data: any) => void
}

const TxForm = ({ address, blockChainPrice, blockChainData, value, set }: TxFormProps) => (
  <Form initial={value} >
    {({ input, values }) => (
      <form onSubmit={e => e.preventDefault() || set(values) || navigate('/txCreation/eth/sign')}>
        <Column>
          <input placeholder={address} {...input('to').bind} />
          <Row>
            <input required={true} placeholder='Amount' {...input('amount').bind} />
            <span>~{(Number(values.amount) * Number(blockChainPrice)).toFixed(2)}$</span>
          </Row>
          <Row>
            <span>Gas price</span>
            <input type='range' {...input('gasPrice').bind} min='1' max='100' />
            <span> {`< ${(Number(blockChainData.avgWait) * Number(values.gasPrice)).toFixed(2)} min`}</span>
          </Row>
          <button type='submit'>Sign</button>
        </Column>
      </form>
    )}
  </Form>
)

export default defaultProps({ blockChainPrice: 0, blockChainData: { avgWait: 1 } })(TxForm)