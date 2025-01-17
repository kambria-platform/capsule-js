var WalletInterface = require('../interface/walletInterface');
var Provider = require('../provider');
var Privatekey = require('./privatekey');
var Mnemonic = require('./mnemonic');
var Keystore = require('./keystore');


class Isoxys extends WalletInterface {
  /**
   * Constructor
   * @param {*} net 
   * @param {*} options - extra options for specific wallets
   * getPassphrase
   * getApproval
   */
  constructor(net, options) {
    super(net, 'softwallet');

    const { getPassphrase, getApproval } = options;
    if (!getPassphrase || !getApproval) throw new Error('Invalid options');
    this.getPassphrase = getPassphrase;
    this.getApproval = getApproval;
  }

  /**
   * @func setWallet
   * Set up acc to storage that can be used as a wallet
   * @param {*} accOpts 
   */
  setWallet = (accOpts, callback) => {
    this.provider = new Provider.SoftWallet(this.net);
    accOpts.getPassphrase = this.getPassphrase;
    accOpts.approveTransaction = this.getApproval;
    return this.provider.init(accOpts, (er, web3) => {
      if (er) return callback(er, null);
      this.web3 = web3;
      return callback(null, web3);
    });
  }

  /**
   * PRIVATE KEY
   */

  /**
   * @func setAccountByPrivatekey
   * Set account by private key. (Do not recommend to use)
   * This function is using private key in direct. Eventhought it was secured by 
   * some cryptographical functions, but we strongly recommend to avoid using it in the
   * production environment.
   * @param {*} privateKey 
   */
  setAccountByPrivatekey = (privateKey, callback) => {
    console.warn(`ATTENTION:
    This function is using private key in direct.
    Eventhought it was secured by some cryptographical functions,
    but we highly recommend to avoid using it in the production environment.`);
    let account = Privatekey.privatekeyToAccount(privateKey);
    if (!account) return callback('Invalid private key', null);
    return this.setWallet(account, callback);
  }

  /**
   * @func getAccountByPrivatekey
   * Get account by private key. (Do not recommend to use)
   * @param {*} privateKey
   * @param {*} callback 
   */
  getAccountByPrivatekey = (privateKey, callback) => {
    console.warn(`ATTENTION:
    This function is using private key in direct.
    Eventhought it was secured by some cryptographical functions,
    but we highly recommend to avoid using it in the production environment.`);
    let account = Privatekey.privatekeyToAccount(privateKey);
    if (!account) return callback('Invalid private key', null);
    return callback(null, account.address);
  }


  /**
   * MNEMONIC / HDKEY
   */

  /**
   * @func setAccountByMnemonic
   * Set account by mnemonic (bip39) following hdkey (bip44)
   * @param {*} mnemonic - 12 words
   * @param {*} password - (optional) password
   * @param {*} path - root derivation path
   * References:
   * m/44'/60'/0'/0: (Default) Jaxx, Metamask, Exodus, imToken, TREZOR (ETH) & BitBox
   * m/44'/60'/0': Ledger (ETH)
   * m/44'/60'/160720'/0': Ledger (ETC)
   * m/44'/61'/0'/0: TREZOR (ETC)
   * m/0'/0'/0': SingularDTV
   * m/44'/1'/0'/0: Network: Testnets
   * m/44'/40'/0'/0: Network: Expanse
   * m/44'/108'/0'/0: Network: Ubiq
   * m/44'/163'/0'/0: Network: Ellaism
   * m/44'/1987'/0'/0: Network: EtherGem
   * m/44'/820'/0'/0: Network: Callisto
   * m/44'/1128'/0'/0: Network: Ethereum Social
   * m/44'/184'/0'/0: Network: Musicoin
   * m/44'/6060'/0'/0: Network: GoChain
   * m/44'/2018'/0'/0: Network: EOS Classic
   * m/44'/200625'/0'/0: Network: Akroma (AKA)
   * m/44'/31102'/0'/0: Network: EtherSocial Network (ESN)
   * m/44'/164'/0'/0: Network: PIRL
   * m/44'/1313114'/0'/0: Network: Ether-1 (ETHO)
   * m/44'/1620'/0'/0: Network: Atheios (ATH)
   * m/44'/889'/0'/0: Network: TomoChain (TOMO)
   * m/44'/76'/0'/0: Network: Mix Blockchain (MIX)
   * m/44'/1171337'/0'/0: Network: Iolite (ILT)
   * 
   * @param {*} index - index of account
   */
  setAccountByMnemonic = (mnemonic, password, path, index, callback) => {
    return Mnemonic.mnemonicToSeed(mnemonic, password, (seed) => {
      let hdk = Mnemonic.seedToHDKey(seed);
      let account = Mnemonic.hdkeyToAccount(hdk, path, index);
      if (!account) return callback('Cannot derive account from mnemonic', null);
      return this.setWallet(account, callback);
    });
  }

  /**
   * @func getAccountsByMnemonic
   * Get list of accounts by mnemonic
   * @param {*} mnemonic - 12 words 
   * @param {*} password - (optional) password
   * @param {*} path - root derivation path (m/44'/60'/0'/0 as default)
   * @param {*} limit - the number of record per page
   * @param {*} page - index of page
   */
  getAccountsByMnemonic = (mnemonic, password, path, limit, page, callback) => {
    return Mnemonic.mnemonicToSeed(mnemonic, password, (seed) => {
      let list = [];
      let hdk = Mnemonic.seedToHDKey(seed);
      for (let i = page * limit; i < page * limit + limit; i++) {
        let address = Mnemonic.hdkeyToAddress(hdk, path, i);
        if (!address) return callback('Cannot derive account from mnemonic', null);
        list.push(address);
      }
      return callback(null, list);
    });
  }


  /**
   * KEYSTORE
   */

  /**
   * @func setAccountByKeystore
   * Set account by keystore file
   * @param {*} input - input object
   * @param {*} password - password
   */
  setAccountByKeystore = (input, password, callback) => {
    Keystore.recover(input, password, (account) => {
      if (!account) return callback('Cannot decrypt keystore', null);
      this.setWallet(account, callback);
    });
  }

  /**
   * @func getAccountByKeystore
   * Get account by keystore file
   * @param {*} input - input object
   * @param {*} password - password
   * @param {*} callback 
   */
  getAccountByKeystore = (input, password, callback) => {
    Keystore.recover(input, password, (account) => {
      if (!account) return callback('Cannot decrypt keystore', null);
      return callback(null, account.address);
    });
  }
}

module.exports = Isoxys;