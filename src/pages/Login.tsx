import * as React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { RouteComponentProps } from 'react-router-dom'

import { QrLogin } from '../components/organisms/QrLogin'

import { getWalletListCommand } from '../helpers/jsonrps'
import { login } from '../store/transport/actions'
import { IConnectedReduxProps, IApplicationState } from '../store'
import { call as prepareCall } from '../helpers/webrtc/jsonrpc'

// TODO: map errorfrom qrcode state and show if we will have it
interface IPropsFromState {
  search: string
  qrcodeData: string
}

interface IPropsFromDispatch {
  scanLoginData: typeof login
}

type AllProps = IPropsFromState &
  IPropsFromDispatch &
  IConnectedReduxProps &
  RouteComponentProps

class LoginPage extends React.Component<AllProps> {
  public render() {
    const { search, scanLoginData, qrcodeData } = this.props

    const isRtc = new URLSearchParams(search).get('rtc') === 'true'
    let cmd = getWalletListCommand()
    const value = isRtc
      ? qrcodeData
      : prepareCall(cmd.method, cmd.id, cmd.params, true)
    return (
      <React.Fragment>
        <QrLogin
          title={'Mobile Login'}
          subtitle={'Scan QR code with Cold Crypto mobile app to login'}
          value={value}
          onScan={scanLoginData}
          readonly={isRtc}
        />
      </React.Fragment>
    )
  }
}

const mapStateToProps = ({ router, transport }: IApplicationState) => ({
  search: router.location.search,
  qrcodeData: transport.qrcodeData,
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  scanLoginData: (data: string) => dispatch(login(data)),
})

export const Login = connect(
  mapStateToProps,
  mapDispatchToProps
)(LoginPage)
