"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var karmajs_1 = require("karmajs");
var karmajs_ws_1 = require("karmajs-ws");
function sendTransaction(from, pubKey, privateKey, to, amount, memoText, callback) {
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
    karmajs_ws_1.ChainConfig.networks.Karma = {
        core_asset: 'KRMT',
        address_prefix: 'KRMT',
        chain_id: 'e81bea67cebfe8612010fc7c26702bce10dc53f05c57ee6d5b720bbe62e51bef',
    };
    karmajs_ws_1.ChainConfig.setPrefix('KRMT');
    var operationParams = {
        fee: { amount: 0, asset_id: '1.3.0' },
        from: from,
        to: to,
        amount: { amount: Math.floor(amount * Math.pow(10, precision)), asset_id: '1.3.0' },
        memo: {
            from: pubKey,
            to: pubKey,
            nonce: karmajs_1.TransactionHelper.unique_nonce_uint64(),
            message: toHex(memoText),
        },
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
