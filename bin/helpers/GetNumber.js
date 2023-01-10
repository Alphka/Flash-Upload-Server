import IsNumber from "./IsNumber.js"

/**
 * @param {number} defaultNumber
 * @param {...any} args
 */
export default function GetNumber(defaultNumber, ...args){
	for(const arg of args) if(IsNumber(arg)) return Number(arg)
	return defaultNumber
}
