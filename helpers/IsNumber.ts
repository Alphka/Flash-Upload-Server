export default function IsNumber(number: any){
	if(!number) return number === 0
	return number = Number(number), Number.isFinite(number) && !Number.isNaN(number)
}
