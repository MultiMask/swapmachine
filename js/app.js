"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var karmajs_ws_1 = require("karmajs-ws");
var karmajs_1 = require("karmajs");
var node_fetch_1 = require("node-fetch");
var blockchain_1 = require("./blockchain");
console.log("hello");
// console.log(Object.keys(ChainStore))
// console.log(Object.keys(Apis.instance))
// console.log(Apis.instance.toString())
var seed = "MULTIMASK KEY 1";
var pkey = karmajs_1.PrivateKey.fromSeed(karmajs_1.key.normalize_brainKey(seed));
console.log("\nPrivate key: " + pkey.toWif());
console.log("Public key: " + pkey.toPublicKey().toString() + "\n");
var karma_url = "wss://testnet-node.karma.red";
// karma_url = "wss://eu.openledger.info/ws"
karmajs_ws_1.Apis.instance(karma_url, true).init_promise.then(function (res) {
    var first = (res || []).filter(function (x) { return !!x; })[0];
    console.assert(first, "no karma networks found!");
    res.forEach(function (x) { return x && console.log("connected to: " + x.api_name); });
    karmajs_ws_1.Apis.instance().db_api().exec("set_subscribe_callback", [updateListener, true]);
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
    processEverything();
    karmajs_1.ChainStore.init().then(function () {
        karmajs_1.ChainStore.subscribe(updateState);
    });
});
function hex2a(hex) {
    if (!hex || (typeof hex !== "string"))
        return undefined;
    return Buffer.from(hex, 'hex').toString('utf8');
}
var dynamicGlobal = null;
function updateState(object) {
    dynamicGlobal = karmajs_1.ChainStore.getObject("2.1.0");
    // console.log("ChainStore object update\n", dynamicGlobal ? dynamicGlobal.toJS() : dynamicGlobal)
    // console.log(ChainStore.getBalanceObjects("1.2.147"))
    // console.log(ChainStore.getAccount("1.2.147"))
}
function updateListener(object) {
    console.log("set_subscribe_callback:\n", object);
}
function processEverything() {
    var a = providers.bitcoin;
    var b = providers.karma;
    processOne(a, b);
    processOne(b, a);
}
function processOne(a, b) {
    a.getIncomingTransactions(function (err, txs) {
        if (err)
            return console.error(err);
        txs.forEach(function (tx) {
            if (!tx.receiver)
                return console.log("non-payable transaction: " + JSON.stringify(tx));
            console.log(tx);
            b.checkTransactionFulfilled(tx.amount, tx.id, tx.receiver, function (err, fulfilled) {
                if (fulfilled)
                    return console.log("skipping fulfilled transaction: " + JSON.stringify(tx));
                b.sendOutgoingTransaction(tx.amount, tx.id, tx.receiver, function (err) {
                    console.log("sent " + tx.amount + " " + tx.receiver.currency + " from " + tx.currency + " tx#" + tx.id + " to " + tx.receiver.address);
                });
            });
        });
    });
}
function getExchangeRate(cur1, cur2, callback) {
    throw "oh come on";
}
function currencyType(w) {
    return { b: "bitcoin", k: "karma" }[w.charAt(0)];
}
function parseWallet(w) {
    var currency = currencyType(w);
    if (!currency)
        return undefined;
    return {
        currency: currency,
        address: w.substr(1)
    };
}
var BITCOIN_ADDR = "mjwpsJcLGWX67FV9LhFkt3Ke6b2zEvDuUw";
BITCOIN_ADDR = "mqs15Gf9bC2Wq3Gx8TEAD9t7z7zVhXnum7";
var KARMA_ADDR = "1.2.148";
var providers = {
    bitcoin: {
        getIncomingTransactions: function (callback) {
            get_binfo("/rawaddr/" + BITCOIN_ADDR, function (err, res) {
                if (!res || !res.txs)
                    return callback("invalid blockchain.info response", undefined);
                var txs = res.txs.map(function (tx) { return ({
                    tx: tx.out.filter(function (o) { return o.addr == BITCOIN_ADDR; })[0],
                    info: Object.assign({}, tx, { inputs: undefined, out: undefined }),
                    op_return: blockchain_1.splitOpReturn((tx.out.filter(blockchain_1.isOpReturn)[0] || { script: "" }).script),
                }); });
                txs = txs.filter(function (x) { return !!x.op_return; });
                // console.log(txs)
                // console.log(txs.map(x => x.op_return))
                // console.log(txs.map(x => JSON.stringify(x.tx)))
                var txs2 = txs.map(function (x) { return ({
                    id: x.info.hash,
                    receiver: parseWallet(x.op_return.data),
                    currency: "bitcoin",
                    amount: x.tx.value,
                }); });
                return callback(undefined, txs2);
            });
        },
        checkTransactionFulfilled: function (amount, txId, receiver, callback) {
            get_binfo("/rawaddr/" + BITCOIN_ADDR, function (err, res) {
                if (!res || !res.txs)
                    return callback("invalid blockchain.info response", undefined);
                var txIds = res.txs.map(function (tx) { return blockchain_1.splitOpReturn((tx.out.filter(blockchain_1.isOpReturn)[0] || { script: "" }).script).data; });
                return callback(undefined, txIds.filter(function (x) { return x == txId; }).length > 0);
            });
        },
        sendOutgoingTransaction: function (amount, txId, receiver, callback) {
            return callback("not implemented yet!", undefined);
        },
    },
    karma: {
        getIncomingTransactions: function (callback) {
            karmajs_ws_1.Apis.instance().history_api().exec("get_account_history", [KARMA_ADDR, "1.11.0", 100, "1.11.0"])
                // .then(karmatxs => console.log(karmatxs.map(tx => tx.op[1].memo)))
                .then(function (ktxs) {
                var txs = ktxs
                    .filter(function (tx) { return tx && tx.id && tx.op && tx.op[1] && tx.op[1].memo; }) // filter out invalid txs
                    .filter(function (tx) { return tx.op[1].to == KARMA_ADDR; }) // incoming txs
                    .map(function (tx) { return ({
                    id: tx.id.replace(/^1\.11\./, ''),
                    currency: "karma",
                    amount: tx.op[1].amount.amount,
                    receiver: parseWallet(hex2a(tx.op[1].memo.message)),
                }); });
                // console.log(txs)
                return callback(undefined, txs);
            })
                .catch(function (x) { return callback(x, undefined); });
        },
        checkTransactionFulfilled: function (amount, txId, receiver, callback) {
            karmajs_ws_1.Apis.instance().history_api().exec("get_account_history", [KARMA_ADDR, "1.11.0", 100, "1.11.0"])
                // .then(karmatxs => console.log(karmatxs.map(tx => tx.op[1].memo)))
                .then(function (ktxs) {
                var txs = ktxs
                    .filter(function (tx) { return tx && tx.id && tx.op && tx.op[1] && tx.op[1].memo; }) // filter out invalid txs
                    .filter(function (tx) { return tx.op[1].from == KARMA_ADDR; }) // incoming txs
                    .filter(function (tx) { return tx.op[1].memo.message == txId; });
                // console.log(txs)
                return callback(undefined, txs.length > 0);
            })
                .catch(function (x) { return callback(x, undefined); });
        },
        sendOutgoingTransaction: function (amount, txId, receiver, callback) {
            return callback("not implemented yet!", undefined);
        },
    }
};
function get_binfo(url, callback) {
    // https://testnet.blockchain.info/rawaddr/mjwpsJcLGWX67FV9LhFkt3Ke6b2zEvDuUw
    url = "https://testnet.blockchain.info" + url;
    console.log(url);
    node_fetch_1.default(url)
        .then(function (x) { return x.json().then(function (json) { return callback(undefined, json); }); })
        .catch(function (e) { return callback(e, undefined); });
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
