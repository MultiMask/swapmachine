"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OP_RETURN = "6a";
function isOpReturn(tx) {
    var script = (typeof tx === "string") ? tx : tx.script;
    if (!script)
        return false;
    return script.startsWith(exports.OP_RETURN);
}
exports.isOpReturn = isOpReturn;
function splitOpReturn(script) {
    if (!isOpReturn(script))
        return null;
    script = script.substr(exports.OP_RETURN.length);
    return { length: parseInt(script.substr(0, 2), 16), data: Buffer.from(script.substr(2), 'hex').toString('utf8') };
}
exports.splitOpReturn = splitOpReturn;
