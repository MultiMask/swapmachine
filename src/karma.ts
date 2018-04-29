import { TransactionBuilder, PrivateKey, TransactionHelper } from "karmajs"

export function sendTransaction(from: string, pubKey: string, privateKey: string, to: string, amount: number, callback: (err, res) => void)
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
	
	
	let operationParams = {
		fee: {amount: 0, asset_id: '1.3.0'},
		from,
		to,
		amount: {amount: Math.floor(amount * Math.pow(10, precision)), asset_id: '1.3.0'},
		/* memo: {
			from: 'KRMT7nKczna7E67Q5JntfeaKfhK3mTnZai6euTzj5tsfebW2W6iEmE',
			to: 'KRMT6y4SbupANg4iPAQ9YNh7pSkTYTPcZ8e8tuDszZezCFDXiP25ie',
			nonce: TransactionHelper.unique_nonce_uint64(),
			message: toHex('testmsg'),
		}, */
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