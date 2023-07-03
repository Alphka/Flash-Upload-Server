export default function LocalInputDate(date: `${number}-${number}-${number}` | string){
	const offset = new Date().getTimezoneOffset()
	const absOffset = Math.abs(offset)
	const gmt = "GMT" + (offset < 0 ? "+" : "-") + ("00" + Math.floor(absOffset / 60)).slice(-2) + ":" + ("00" + (absOffset % 60)).slice(-2)

	return new Date(`${date} ${gmt}`)
}
