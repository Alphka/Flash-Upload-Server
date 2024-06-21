export default function GetInputDate(date: string | number | Date = new Date){
	return new Date(date).toJSON().slice(0, 10)
}
