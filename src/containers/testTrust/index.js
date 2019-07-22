import React, { Component } from 'react';
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import { Trust } from 'capsule-core-js';

const DEFAULT_STATE = {
  visible: false,
  network: null,
  account: null,
  balance: null,
  txId: null,
  error: null
}

class TestTrust extends Component {
  constructor() {
    super();
    this.state = { ...DEFAULT_STATE };
    this.trust = new Trust(1, 'hybridwallet', true);
  }

  getAuthentication = {
    open: (code, callback) => {
      WalletConnectQRCodeModal.open(code, () => {
        return callback('User denied to connect', null);
      });
    },
    close: () => {
      WalletConnectQRCodeModal.close();
    }
  }

  connect = () => {
    this.trust.setAccountByTrustWallet(this.getAuthentication, (er, web3) => {
      if (er) return console.error(er);
      this.watcher = this.trust.watch((er, re) => {
        if (er) return console.error(er);
        this.setState(re);
      });
    });
  }

  sendTx = () => {
    if (this.trust) this.trust.web3.eth.sendTransaction({
      from: this.state.account,
      to: this.state.account,
      value: '100000000000000'
    }, (er, txId) => {
      if (er) return console.error(er);
      return console.log(txId);
    });
  }

  logout = () => {
    if (this.trust) this.trust.logout();
  }

  componentWillUnmount() {
    if (this.watcher) this.watcher.stopWatching();
  }

  render() {
    return (
      <div>
        <h1>Trust Test</h1>
        <button onClick={this.connect}>Connect</button>
        <button onClick={this.sendTx}>Send</button>
        <button onClick={this.logout}>Logout</button>
        <p>Network: {this.state.network}</p>
        <p>Account: {this.state.account}</p>
        <p>Balance: {this.state.balance}</p>
      </div>
    );
  }
}

export default TestTrust;