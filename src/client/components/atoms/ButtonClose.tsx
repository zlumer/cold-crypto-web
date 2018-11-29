import React from 'react'
import styled from 'react-emotion'
import { withRouter } from 'react-router'
import { History } from 'history'

import { Link } from 'react-router-dom'
import icon from '../../images/x-mark-thin.svg'

const Root = styled('div')({
  alignSelf: 'center',
  marginLeft: '1rem',
})

const Img = styled('img')({
  height: '1.5rem',
  width: '1.5rem',
})

export default withRouter(({ history }: { history: History }) => (
  <Root onClick={() => history.goBack()}>
    <Img src={icon} />
  </Root>
))