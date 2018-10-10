import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { injectGlobal } from 'emotion'
import { BrowserRouter, Switch, Route } from 'react-router-dom'

import Home from './components/Home'
import Login from './components/Login'
import WalletList from './components/WalletList'
import Wallet from './components/Wallet'
import TxCreation from './components/TxCreation'

injectGlobal({
  'html,body': {
    margin: 0
  }
})

class Root extends Component {
	public render() {
		return (
      <BrowserRouter>
        <Switch>
          <Route path='/' exact component={Home} />
          <Route path='/login' component={Login} />
          <Route path='/wallets' component={WalletList} />
          <Route path='/wallet/:symbol/:address' component={Wallet} />
          <Route path='/txCreation/:blockchain/:address' component={TxCreation} />
        </Switch>
      </BrowserRouter>
		)
	}
}

ReactDOM.render(<Root />, document.querySelector('#root'))