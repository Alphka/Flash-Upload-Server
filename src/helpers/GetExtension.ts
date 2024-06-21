export default function GetExtension(filename: string){
	if(filename.endsWith(".d.ts")) return "d.ts"
	const lastIndex = filename.lastIndexOf(".")
	return lastIndex === -1 ? null : filename.substring(lastIndex + 1)
}
