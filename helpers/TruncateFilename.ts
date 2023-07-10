import GetExtension from "./GetExtension"

export default function TruncateFilename(filename: string, maxLength = 35){
	filename = filename.trim()

	if(filename.length < maxLength + 1) return filename

	const ellipsis = "…"
	const extension = GetExtension(filename)
	const begin = filename.substring(0, maxLength - (extension?.length || 0) - ellipsis.length)

	return begin.trim() + ellipsis + extension
}
