import * as React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import styled from 'react-emotion'
import { css } from 'emotion'
import { createEosContract } from '../../store/transport/actions'
import { IEosContractFormValues, IWalletEos } from '../../store/wallets/types'
import {
  H2,
  H3,
  Column,
  Label,
  TextInput,
  ButtonBase,
  Row,
  SelectOptions,
} from '../../components/atoms'

import { getEos, EosContract } from '../../helpers/eos'
import { formToJson } from '../../helpers/func'
import { IApplicationState } from '../../store'

const Error = styled('div')`
  margin-top: 10px;
  font-weight: bold;
`

const styles = {
  offtop: css`
    margin-top: 25px;
  `,
  select: css`
    padding: 0.8rem 1rem;
  `,
}

interface IPropsFromDispatch {
  createTx: typeof createEosContract
  wallet: IWalletEos
}

interface IStateProps {
  address: string
  contract: EosContract | null
  action: string
  error: string
}

type AllProps = IPropsFromDispatch

class CreateEosContractPage extends React.Component<AllProps, IStateProps> {
  constructor(props: AllProps) {
    super(props)

    this.state = {
      address: '',
      contract: null,
      action: '',
      error: '',
    }
  }

  handleChangeAddress = async (e: any) => {
    const value = e.target.value

    this.setState({
      address: value,
    })
  }

  handleSubmit = async (e: any) => {
    e.preventDefault()

    try {
      const eos = getEos(this.props.wallet)
      const contract = new EosContract(eos)

      if (await contract.assignContract(this.state.address)) {
        this.setState({
          contract,
        })
      }
    } catch (e) {
      this.setState({
        error: 'Contract not found',
      })
    }
  }

  handleConfirm = (e: any) => {
    e.preventDefault()

    const data = formToJson(e.target)
    this.props.createTx({
      to: this.state.address,
      method: this.state.action,
      data,
      abi: this.state.contract!.getMethodAbi(this.state.action),
    })
  }

  handleMethodSelect = (e: any) => {
    const value = e.target.value
    this.setState({
      action: value,
    })
  }

  render() {
    return (
      <React.Fragment>
        {!this.state.contract && (
          <form onSubmit={this.handleSubmit}>
            <H2>Call Contract EOS</H2>
            <Column>
              <Row>
                <Column style={{ flexBasis: '100%', marginRight: '0%' }}>
                  <TextInput
                    type="text"
                    placeholder="contract name"
                    value={this.state.address}
                    onChange={this.handleChangeAddress}
                  />
                </Column>
              </Row>
              <Row>{this.state.error && <Error>{this.state.error}</Error>}</Row>
              <Column
                style={{ width: '40%', marginLeft: '30%', marginTop: '50px' }}
              >
                <ButtonBase type="submit">Find contract</ButtonBase>
              </Column>
            </Column>
          </form>
        )}
        {this.state.contract && (
          <React.Fragment>
            <H2>Call Contract EOS</H2>
            <H3>{this.state.address}</H3>
            <Row className={styles.offtop}>
              <Column>
                <Label>Contract method:</Label>
                <SelectOptions
                  onChange={this.handleMethodSelect}
                  name="method"
                  className={styles.select}
                >
                  <option value="">Select method</option>
                  {this.state.contract.getActions().map((item: any) => (
                    <option key={item.type} value={item.type}>
                      {item.name}
                    </option>
                  ))}
                </SelectOptions>
              </Column>
            </Row>
            <form onSubmit={this.handleConfirm}>
              {this.state.action && (
                <React.Fragment>
                  <H3 className={styles.offtop}>Parameters:</H3>
                  {Object.entries(
                    this.state.contract.getMethodFields(this.state.action)
                  ).map((item: any[]) => {
                    return (
                      <Row key={item[0]}>
                        <Column>
                          <Label>{item[0]}:</Label>
                          <TextInput
                            name={item[0]}
                            type="text"
                            placeholder={item[0]}
                          />
                        </Column>
                      </Row>
                    )
                  })}
                </React.Fragment>
              )}
              {this.state.action && (
                <ButtonBase type="submit" className={styles.offtop}>
                  Sign
                </ButtonBase>
              )}
            </form>
          </React.Fragment>
        )}
      </React.Fragment>
    )
  }
}

const mapStateToProps = ({ wallets }: IApplicationState) => ({
  wallet: wallets.item,
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  createTx: (data: IEosContractFormValues) => dispatch(createEosContract(data)),
})

export const CallEosContract = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateEosContractPage)
