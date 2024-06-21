export default function isNumber(number: any){
	if(!number) return number === 0
	number = Number(number)
	return Number.isFinite(number) && !Number.isNaN(number)
}
