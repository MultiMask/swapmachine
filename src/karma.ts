import { TransactionBuilder, PrivateKey, TransactionHelper } from "karmajs"
import { ChainConfig } from "karmajs-ws"

export function sendTransaction(from: string, pubKey: string, privateKey: string, to: string, amount: number, memoText: string, callback: (err, res) => void)
{
	function toHex(str)
	{
		var hex = ''
		for(var i=0;i<str.length;i++) {
			hex += ''+str.charCodeAt(i).toString(16)
		}
		return hex
	}
	const tr = new TransactionBuilder()
	const precision = 5
	const pkey = PrivateKey.fromWif(privateKey)
	
	
	ChainConfig.networks.Karma = {
		core_asset:  'KRMT',
		address_prefix:  'KRMT',
		chain_id: 'e81bea67cebfe8612010fc7c26702bce10dc53f05c57ee6d5b720bbe62e51bef',
	}
	
	
	ChainConfig.setPrefix('KRMT')

	let operationParams = {
		fee: {amount: 0, asset_id: '1.3.0'},
		from,
		to,
		amount: {amount: Math.floor(amount * Math.pow(10, precision)), asset_id: '1.3.0'},
		memo: {
			from: pubKey,
			to: pubKey,
			nonce: TransactionHelper.unique_nonce_uint64(),
			message: toHex(memoText),
		},
	}
	
	
	console.log(operationParams)
	
	tr.add_type_operation(
		'transfer',
		operationParams,
	)
	
	tr.set_required_fees().then(x => {
		tr.add_signer(pkey, pubKey)
		console.log("serialized transaction:", tr.serialize())
		tr.broadcast(() => callback(undefined, tr.id()))
	}).catch(err => callback(err, undefined))
}