/**
 * @param {number} defaultNumber
 * @param {...any} args
 */
export default function GetNumber(defaultNumber, ...args){
	for(const arg of args){
		if(arg === 0) return 0
		if(!arg) continue

		const number = Number(arg)
		if(Number.isFinite(number) && !Number.isNaN(number)) return number
	}

	return defaultNumber
}
