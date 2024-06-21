import GetExtension from "./GetExtension"

export default function GetFileName(filename: string){
	const extension = GetExtension(filename)

	switch(extension){
		case null: return filename
		case "d.ts": {
			const lastIndex = filename.lastIndexOf(".")
			filename = filename.substring(0, lastIndex)
			return filename.substring(0, filename.lastIndexOf("."))
		}
		default: {
			const name = filename.substring(0, filename.lastIndexOf("."))
			return name.length ? name : filename
		}
	}
}
