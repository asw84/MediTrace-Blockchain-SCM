const { Web3 } = require('web3');
require('dotenv').config();
const SupplyChainABI = require('../contracts/SupplyChain.json');

const web3js = new Web3(process.env.BLOCKCHAIN_NODE_URL);

// Add account from private key for signing transactions
if (process.env.OWNER_PRIVATE_KEY) {
    const account = web3js.eth.accounts.privateKeyToAccount('0x' + process.env.OWNER_PRIVATE_KEY.replace('0x', ''));
    web3js.eth.accounts.wallet.add(account);
    web3js.eth.defaultAccount = account.address;
    console.log('Wallet configured:', account.address);
}

const contract = new web3js.eth.Contract(SupplyChainABI.abi, process.env.CONTRACT_ADDRESS);

module.exports = { web3js, contract }