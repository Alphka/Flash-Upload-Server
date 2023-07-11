export default function LocalInputDate(date: `${number}-${number}-${number}` | string){
	const [year, month, day] = date.split("-").map(Number) as [number, number, number]
	const offset = new Date().getTimezoneOffset()

	return new Date(Date.UTC(year, month - 1, day) + offset * 60e3)
}
