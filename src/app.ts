import { Apis } from "karmajs-ws"
import { ChainStore, PrivateKey, key as kkey } from "karmajs"
import fetch from "node-fetch"
import { splitOpReturn, isOpReturn } from "./blockchain";
import * as btc from "./bitcoin"
import * as krm from "./karma"

console.log("hello")
// console.log(Object.keys(ChainStore))
// console.log(Object.keys(Apis.instance))
// console.log(Apis.instance.toString())


// let seed = "MULTIMASK KEY 1"
// let pkey = PrivateKey.fromSeed( kkey.normalize_brainKey(seed) )

// console.log(`\nPrivate key: ${pkey.toWif()}`)
// console.log(`Public key: ${pkey.toPublicKey().toString()}\n`)

let karma_url = "wss://testnet-node.karma.red"
// karma_url = "wss://eu.openledger.info/ws"

Apis.instance(karma_url, true).init_promise.then(res =>
{
	let first = (res || []).filter(x => !!x)[0]
	console.assert(first, "no karma networks found!")

	res.forEach(x => x && console.log(`connected to: ${x.api_name}`))
	Apis.instance().db_api().exec("set_subscribe_callback", [ updateListener, true ])

	// Apis.instance.
	/* Apis.instance().history_api().exec("get_account_history", ["1.2.147"])
		.then(x => console.log(x))
		.catch(x => console.log(x))
	
	Apis.instance().db_api().exec("get_accounts", [["1.2.147"]])
		.then(x => console.log(x))
		.catch(x => console.log(x)) */
	
	/* Apis.instance().db_api().exec("get_account_by_name", ["devman10"])
		.then(x => console.log(x))
		.catch(x => console.log(x)) */
	
	// Apis.instance().db_api().exec("get_ticker", ["KRMT", "KUSDT"])
	// Apis.instance().db_api().exec("get_order_book", ["RUDEX.KRM", "GDEX.BTC", 50])
	// Apis.instance().db_api().exec("get_order_book", ["USD", "OPEN.KRM", 50])
	/* Apis.instance().db_api().exec("get_ticker", ["USD", "OPEN.KRM"])
	// Apis.instance().db_api().exec("list_assets", ["", 100])
		.then(x => console.log(x))
		.catch(x => console.log(x)) */

	/* Apis.instance().history_api().exec("get_account_history", ["1.2.148", "1.11.0", 100, "1.11.0"])
		.then(x => console.log(x.map(a => hex2a((a.op[1].memo || {}).message))))
		.catch(x => console.log(x)) */
	
	// Apis.instance().db_api().exec("get_balance_objects", [[address]])

	// let a = ChainStore.getBalanceObjects("1.2.147")
	// console.log(a)

	setInterval(processEverything, 10000)

	ChainStore.init().then(() =>
	{
		ChainStore.subscribe(updateState)
	})
})

function hex2a(hex: string)
{
	if (!hex || (typeof hex !== "string"))
		return undefined
	
	return Buffer.from(hex, 'hex').toString('utf8')
}

let dynamicGlobal = null;
function updateState(object)
{
	dynamicGlobal = ChainStore.getObject("2.1.0")
	// console.log("ChainStore object update\n", dynamicGlobal ? dynamicGlobal.toJS() : dynamicGlobal)
	// console.log(ChainStore.getBalanceObjects("1.2.147"))
	// console.log(ChainStore.getAccount("1.2.147"))
}


function updateListener(object)
{
	console.log("set_subscribe_callback:\n", object)
}


let processedBtcTransactions = {}

function processEverything()
{
	let a = providers.bitcoin
	let b = providers.karma
	processOne(a, b)
	processOne(b, a)
}
function processOne(a: IBlockchainProvider, b: IBlockchainProvider)
{
	a.getIncomingTransactions((err, txs) =>
	{
		if (err)
			return console.error(`error: ${(err && err.message) || err}`)
		
		txs.forEach(tx =>
		{
			if (!tx.receiver)
				return console.log(`non-payable transaction: ${JSON.stringify(tx)}`)
		})
		let seq = txs.filter(tx => !!tx.receiver)
		console.log(`seq: ${seq}`)
		run()

		function run()
		{
			if (!seq.length)
				return
			
			let tx = seq.pop()
			
			console.log(`checking tx#${tx.id}`)

			b.checkTransactionFulfilled(tx.amount, tx.id, tx.receiver, (err, fulfilled) =>
			{
				console.log(`tx#${tx.id}: ${fulfilled ? "fulfilled" : "NEW"}`)
				if (fulfilled)
					return console.log(`skipping fulfilled transaction: ${JSON.stringify(tx)}`)
				
				b.sendOutgoingTransaction(tx.amount, tx.id, tx.receiver, (err, txId) =>
				{
					if (err)
						return console.error(`error: ${(err && err.message) || err}`)
					
					console.log(`sent ${tx.amount} ${tx.receiver.currency} from ${tx.currency} tx#${tx.id} to ${tx.receiver.address} (tx id: ${txId})`)
					run()
				})
			})
		}
	})
}

type ICurrencyType = "bitcoin" | "karma"
interface IBlockchainWallet
{
	currency: ICurrencyType
	address: string
}
interface ITransaction
{
	id: string
	currency: ICurrencyType
	amount: number
	receiver: IBlockchainWallet
}
interface IBlockchainProvider
{
	getIncomingTransactions(callback: (err, txs: ITransaction[]) => void)
	sendOutgoingTransaction(amount: number, txId: string, receiver: IBlockchainWallet, callback: (err, txid: string) => void)
	checkTransactionFulfilled(amount: number, txId: string, receiver: IBlockchainWallet, callback: (err, fulfilled: boolean) => void)
}
interface IExchangeRate
{
	curBuy: ICurrencyType
	curSell: ICurrencyType
	rate: number
}
function getExchangeRate(cur1: ICurrencyType, cur2: ICurrencyType, callback: (err, rate: IExchangeRate) => void)
{
	throw "oh come on";
}
function currencyType(w: string): ICurrencyType
{
	return {b: "bitcoin", k: "karma"}[w.charAt(0)]
}
function parseWallet(w: string): IBlockchainWallet
{
	let currency = currencyType(w)
	if (!currency)
		return undefined
	
	return {
		currency,
		address: w.substr(1)
	}
}

let BITCOIN_ADDR = "mjwpsJcLGWX67FV9LhFkt3Ke6b2zEvDuUw"
// BITCOIN_ADDR = "mqs15Gf9bC2Wq3Gx8TEAD9t7z7zVhXnum7"
let KARMA_ADDR = "1.2.148"

btc.setAddrPk("mjwpsJcLGWX67FV9LhFkt3Ke6b2zEvDuUw", "cQv9JPQDbkDDVkM1N6zB6UEWTnviQirYhhnm5KsSWpZvZetAzMyJ")

// krm.sendTransaction("KRMT6y4SbupANg4iPAQ9YNh7pSkTYTPcZ8e8tuDszZezCFDXiP25ie", "5KZNJefhU42LVUpsRn5nSYyiBPXhEBxCG5R3L4W9VtWbu2J7YSV", "1.2.149", 0.001)

// btc.createTransaction(BITCOIN_ADDR, 12000, "k1.2.148")
// 	.then(tx =>
// 	{
// 		post_btx(tx, (err, res) => err ? console.error(err) : console.log(res))
// 	})
// 	.catch(err => console.error(err))

let providers: { [id: string]: IBlockchainProvider } = {
	bitcoin: {
		getIncomingTransactions(callback: (err, txs: ITransaction[]) => void)
		{
			get_binfo(`/rawaddr/${BITCOIN_ADDR}`, (err, res) =>
			{
				if (!res || !res.txs)
					return callback("invalid blockchain.info response", undefined)
				
				let txs = res.txs.map(tx => ({
					tx: tx.out.filter(o => o.addr == BITCOIN_ADDR)[0],
					info: Object.assign({}, tx, { inputs: undefined, out: undefined }),
					op_return: splitOpReturn((tx.out.filter(isOpReturn)[0] || { script: "" }).script),
				}))
				txs = txs.filter(x => !!x.op_return)
				// console.log(txs)
				// console.log(txs.map(x => x.op_return))
				// console.log(txs.map(x => JSON.stringify(x.tx)))
				let txs2: ITransaction[] = txs.map(x => ({
					id: x.info.hash,
					receiver: parseWallet(x.op_return.data),
					currency: "bitcoin",
					amount: x.tx.value,
				}))
				return callback(undefined, txs2)
			})
		},
		checkTransactionFulfilled(amount: number, txId: string, receiver: IBlockchainWallet, callback: (err, fulfilled: boolean) => void)
		{
			get_binfo(`/rawaddr/${BITCOIN_ADDR}`, (err, res) =>
			{
				if (!res || !res.txs)
					return callback("invalid blockchain.info response", undefined)
				
				let txIds: string[] = res.txs.map(tx => splitOpReturn((tx.out.filter(isOpReturn)[0] || { script: "" }).script).data)
				return callback(undefined, txIds.filter(x => x == txId).length > 0)
			})
		},
		sendOutgoingTransaction(amount: number, txId: string, receiver: IBlockchainWallet, callback: (err, txid: string) => void)
		{
			console.log(`outgoing bitcoin: ${amount} for tx#${txId} to (${receiver.currency})${receiver.address}`)

			
			btc.createTransaction(BITCOIN_ADDR, 12000, txId)
				.then(tx =>
				{
					// post_btx(tx, (err, res) => callback(undefined, res))
				})
				.catch(err => callback(err, undefined))
		},
	},
	karma: {
		getIncomingTransactions(callback: (err, txs: ITransaction[]) => void)
		{
			Apis.instance().history_api().exec("get_account_history", [KARMA_ADDR, "1.11.0", 100, "1.11.0"])
				// .then(karmatxs => console.log(karmatxs.map(tx => tx.op[1].memo)))
				.then(ktxs =>
				{
					let txs = ktxs
						.filter(tx => tx && tx.id && tx.op && tx.op[1] && tx.op[1].memo) // filter out invalid txs
						.filter(tx => tx.op[1].to == KARMA_ADDR) // incoming txs
						.map(tx => ({
							id: tx.id.replace(/^1\.11\./, ''),
							currency: "karma", // TODO: CHANGE TO ASSET ID!!! (fetch data from karma to local ChainStore on the start, compare ids of currencies to names)
							amount: tx.op[1].amount.amount,
							receiver: parseWallet(hex2a(tx.op[1].memo.message)),
						}))
					// console.log(txs)
					return callback(undefined, txs)
				})
				.catch(x => callback(x, undefined))
		},
		checkTransactionFulfilled(amount: number, txId: string, receiver: IBlockchainWallet, callback: (err, fulfilled: boolean) => void)
		{
			if (processedBtcTransactions[txId])
				return callback(undefined, true)

			Apis.instance().history_api().exec("get_account_history", [KARMA_ADDR, "1.11.0", 100, "1.11.0"])
				// .then(karmatxs => console.log(karmatxs.map(tx => tx.op[1].memo)))
				.then(ktxs =>
				{
					console.log(ktxs.map())
					let txs: any[] = ktxs
						.filter(tx => tx && tx.id && tx.op && tx.op[1] && tx.op[1].memo) // filter out invalid txs
						.filter(tx => tx.op[1].from == KARMA_ADDR) // incoming txs
						.filter(tx => tx.op[1].memo.message == txId)
					console.log(txs)
					return callback(undefined, txs.length > 0)
				})
				.catch(x => callback(x, undefined))
		},
		sendOutgoingTransaction(amount: number, txId: string, receiver: IBlockchainWallet, callback: (err, txid: string) => void)
		{
			console.log(`outgoing karma: ${amount} for tx#${txId} to (${receiver.currency})${receiver.address}`)
			krm.sendTransaction("KRMT6y4SbupANg4iPAQ9YNh7pSkTYTPcZ8e8tuDszZezCFDXiP25ie", "5KZNJefhU42LVUpsRn5nSYyiBPXhEBxCG5R3L4W9VtWbu2J7YSV", "1.2.147", 0.001, (err, res) =>
			{
				processedBtcTransactions[txId] = true
			})
		},
	}
}

function post_btx(hex: string, callback: (err, res) => void)
{
	let url = `https://testnet.blockchain.info/pushtx?tx=${hex}`
	fetch(url, { method: "POST" })
		.then(x => x.text().then(text => callback(undefined, text)))
		.catch(e => callback(e, undefined))
}
function get_binfo(url: string, callback: (err, json) => void)
{
	// https://testnet.blockchain.info/rawaddr/mjwpsJcLGWX67FV9LhFkt3Ke6b2zEvDuUw
	url = `https://testnet.blockchain.info${url}`
	console.log(url)
	fetch(url)
		.then(x => x.json().then(json => callback(undefined, json)))
		.catch(e => callback(e, undefined))
}

/*

Your login:
multimask1

Your password:
multimask1pass

Your private key:
5K1TY5RrqvEKHD2gMum2dLDzzcyDvifGd2EZvQfr7PVMdF3DTJ4

Public key
KRMT7d1CXuXwfNWD3ZKDhSRLWjfdbzavRwRHDhW1Kk4yDunErV2ahg

*/

/*
bitcoin

private:
KwNrVaDnDgtfcb2EvWjSFtkntx8name19UcE7WbJ6vjMF5UEnSfU

public:
1KgmspoWicd5Z1G6p3hB73nuNwx7fT9dum


testnet

private:
cQv9JPQDbkDDVkM1N6zB6UEWTnviQirYhhnm5KsSWpZvZetAzMyJ

public:
mjwpsJcLGWX67FV9LhFkt3Ke6b2zEvDuUw

 */


/*
Your login:
devman10

Your password:
xswedcvfrtgb

Your private key:
5KZNJefhU42LVUpsRn5nSYyiBPXhEBxCG5R3L4W9VtWbu2J7YSV

Public key
KRMT6y4SbupANg4iPAQ9YNh7pSkTYTPcZ8e8tuDszZezCFDXiP25ie

Private key (WIF)
5KZNJefhU42LVUpsRn5nSYyiBPXhEBxCG5R3L4W9VtWbu2J7YSV
 */