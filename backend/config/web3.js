const { Web3 } = require('web3');
require('dotenv').config();
const SupplyChainABI = require('../contracts/SupplyChain.json');

const blockchainNodeUrl = process.env.BLOCKCHAIN_NODE_URL || 'http://127.0.0.1:8545';
const web3js = new Web3(blockchainNodeUrl);

if (process.env.OWNER_PRIVATE_KEY) {
    const account = web3js.eth.accounts.privateKeyToAccount('0x' + process.env.OWNER_PRIVATE_KEY.replace('0x', ''));
    web3js.eth.accounts.wallet.add(account);
    web3js.eth.defaultAccount = account.address;
    console.log('Wallet configured:', account.address);
}

if (!process.env.CONTRACT_ADDRESS) {
    console.warn('CONTRACT_ADDRESS is not set. Deploy the contract and update backend/.env before using blockchain routes.');
}

const contract = new web3js.eth.Contract(SupplyChainABI.abi, process.env.CONTRACT_ADDRESS);

module.exports = { web3js, contract };
