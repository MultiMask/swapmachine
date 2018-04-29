"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bitcoin = require("bitcoinjs-lib");
var axios_1 = require("axios");
var address = "";
var pk = "";
function setAddrPk(_address, _pk) {
    address = _address;
    pk = _pk;
}
exports.setAddrPk = setAddrPk;
function getInfo() {
    var url = 'https://testnet.blockchain.info/rawaddr/';
    return axios_1.default.get("" + url + address).then(function (res) {
        var lastOUT = res.data.txs[0];
        // console.log(lastOUT)
        var outputIndex = lastOUT.out. /* slice().reverse(). */findIndex(function (item) { return item.addr === address; });
        // console.log(outputIndex)
        // console.log(res.data)
        return {
            index: outputIndex,
            address: res.data.address,
            output: lastOUT.hash,
            // outputs: lastOUT.out.filter(x => x.addr === address),
            balance: res.data.final_balance,
            txs: res.data.txs
        };
    });
}
exports.getInfo = getInfo;
function createTransaction(to, amount, data) {
    return getInfo().then(function (_a) {
        // SEND signed Tx
        // console.log("create TX with: ")
        // console.log('private: ', pk)
        // console.log('to: ', to)
        // console.log('amount: ', amount)
        // console.log('data: ', data)
        // console.log('output: ', output)
        // console.log('balance: ', balance)
        var output = _a.output, balance = _a.balance, index = _a.index;
        var SUM = balance;
        // SUM = outputs.reduce((prev, cur) => prev + cur.value, 0)
        if ((SUM - 15000) < amount)
            throw "not enough money to send! has: " + SUM + ", need: " + amount;
        // console.log(`has: ${SUM}, need: ${amount}\noutput:${output}`)
        var testnet = bitcoin.networks.testnet;
        var bitcoin_payload = Buffer.from(data, 'utf8');
        var dataScript = bitcoin.script.nullData.output.encode(bitcoin_payload);
        var keyPair = bitcoin.ECPair.fromWIF(pk, testnet);
        // console.log(outputs)
        var txb = new bitcoin.TransactionBuilder(testnet);
        // outputs.forEach(x => txb.addInput(output, x.n))
        // console.log(txb)
        txb.addInput(output, index);
        txb.addOutput(dataScript, 0);
        txb.addOutput(to, amount);
        txb.addOutput(address, SUM - amount - 15000);
        txb.sign(0, keyPair);
        return txb.build().toHex();
    });
}
exports.createTransaction = createTransaction;
