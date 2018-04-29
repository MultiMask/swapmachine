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
		// console.log(lastOUT)
		const outputIndex = lastOUT.out./* slice().reverse(). */findIndex(item => item.addr === address)

		// console.log(outputIndex)
		// console.log(res.data)

		return {
			index: outputIndex,
			address: res.data.address,
			output: lastOUT.hash,
			// outputs: lastOUT.out.filter(x => x.addr === address),
			balance: res.data.final_balance,
			txs: res.data.txs
		}
	})
}
export function createTransaction(to, amount: number, data)
{
	return getInfo().then(({ output, balance, index, /* outputs */ }) =>
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

		// SUM = outputs.reduce((prev, cur) => prev + cur.value, 0)

		if ((SUM - 15000) < amount)
			throw `not enough money to send! has: ${SUM}, need: ${amount}`
		
		// console.log(`has: ${SUM}, need: ${amount}\noutput:${output}`)

		let testnet = bitcoin.networks.testnet
		let bitcoin_payload = Buffer.from(data, 'utf8')
		let dataScript = bitcoin.script.nullData.output.encode(bitcoin_payload)
		let keyPair = bitcoin.ECPair.fromWIF(pk, testnet)
	
		// console.log(outputs)
		let txb = new bitcoin.TransactionBuilder(testnet)
		// outputs.forEach(x => txb.addInput(output, x.n))
		// console.log(txb)
		txb.addInput(output, index)
	
		txb.addOutput(dataScript, 0)
		txb.addOutput(to, amount)
		txb.addOutput(address, SUM - amount - 15000)
		txb.sign(0, keyPair)

		return txb.build().toHex()
	})
}