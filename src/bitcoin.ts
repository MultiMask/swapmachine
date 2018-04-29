import * as bitcoin from "bitcoinjs-lib"
import axios from 'axios'

let address = ""
let pk = ""

export function setAddrPk(_address: string, _pk: string)
{
	address = _address
	pk = _pk
}

export function getInfo()
{
	const url = 'https://testnet.blockchain.info/rawaddr/'

	return axios.get(`${url}${address}`).then(res =>
	{
		const lastOUT = res.data.txs[0]
		const outputIndex = lastOUT.out.findIndex(item => item.addr === address)

		// console.log(outputIndex)
		// console.log(res.data)

		return {
			index: outputIndex,
			address: res.data.address,
			output: lastOUT.hash,
			balance: res.data.final_balance,
			txs: res.data.txs
		}
	})
}
export function createTransaction(to, amount: number, data)
{
	return getInfo().then(({ output, balance, index }) =>
	{

		// SEND signed Tx
		// console.log("create TX with: ")
		// console.log('private: ', pk)
		// console.log('to: ', to)
		// console.log('amount: ', amount)
		// console.log('data: ', data)
		// console.log('output: ', output)
		// console.log('balance: ', balance)
  
		let SUM = balance

		let testnet = bitcoin.networks.testnet
		let bitcoin_payload = Buffer.from(data, 'utf8')
		let dataScript = bitcoin.script.nullData.output.encode(bitcoin_payload)
		let keyPair = bitcoin.ECPair.fromWIF(pk, testnet)
	
		let txb = new bitcoin.TransactionBuilder(testnet)
		txb.addInput(output, index)
	
		txb.addOutput(dataScript, 0)
		txb.addOutput(to, amount)
		txb.addOutput(address, SUM - amount - 5000)
		txb.sign(0, keyPair)

		return txb.build().toHex()
	})
}