export const OP_RETURN = "6a"
export function isOpReturn(tx: string | { script: string }): boolean
{
	let script: string = (typeof tx === "string") ? tx : tx.script
	if (!script)
		return false
	
	return script.startsWith(OP_RETURN)
}
export function splitOpReturn(script: string): { length: number, data: string }
{
	if (!isOpReturn(script))
		return null
	
	script = script.substr(OP_RETURN.length)
	
	return { length: parseInt(script.substr(0, 2), 16), data: Buffer.from(script.substr(2), 'hex').toString('utf8') }
}