import React from 'react'
import RTCHelper from '../../services/webrtc'

import { scanAnswer } from '../../actions'
import { Container, Centered, Column, Row } from '../shared/layout'

import Offer from './OfferAndAnswer'
import Candidates from './Candidates'
import { connect } from 'react-redux'

class Webrtc extends React.Component {
  state = {
    offer: '',
    rpc: RTCHelper,
    connected: false,
    answer: null
  }

  componentDidMount = async () => {
    const { rpc } = this.state
    const offer = await rpc.createOffer()

    this.setState({offer})
  }

  handlePushAnswer = async (answer) => {
    const { rpc } = this.state
    this.setState({answer})
    console.log('start pus answer')
    await rpc.pushAnswer(answer)
    console.log('Set Answer')

    console.log('wait connection')
    await rpc.waitConnection()

    this.setState({connected: true})
    console.log('connection ready')
  }

  render () {
    const { rpc, offer, answer, connected } = this.state
    return (
      <Container>
        {!answer && <Offer qrcodeValue={offer} scanAnswer={ this.handlePushAnswer }/>}
        { rpc.candidates.length !== 0 && !connected && <Candidates candidates={rpc.candidates}/> }
      </Container>
    )
  }
}

export default Webrtc
