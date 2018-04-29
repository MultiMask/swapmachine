"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var karmajs_1 = require("karmajs");
function sendTransaction(from, pubKey, privateKey, to, amount, callback) {
    function toHex(str) {
        var hex = '';
        for (var i = 0; i < str.length; i++) {
            hex += '' + str.charCodeAt(i).toString(16);
        }
        return hex;
    }
    var tr = new karmajs_1.TransactionBuilder();
    var precision = 5;
    var pkey = karmajs_1.PrivateKey.fromWif(privateKey);
    var operationParams = {
        fee: { amount: 0, asset_id: '1.3.0' },
        from: from,
        to: to,
        amount: { amount: Math.floor(amount * Math.pow(10, precision)), asset_id: '1.3.0' },
    };
    console.log(operationParams);
    tr.add_type_operation('transfer', operationParams);
    tr.set_required_fees().then(function (x) {
        tr.add_signer(pkey, pubKey);
        console.log("serialized transaction:", tr.serialize());
        tr.broadcast(function () { return callback(undefined, tr.id()); });
    }).catch(function (err) { return callback(err, undefined); });
}
exports.sendTransaction = sendTransaction;
