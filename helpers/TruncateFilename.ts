export default function TruncateFilename(filename: string, maxLength = 35){
	filename = filename.trim()

	if(filename.length < maxLength + 1) return filename

	const ellipsis = "…"
	const extension = filename.substring(filename.lastIndexOf(".") + 1)
	const begin = filename.substring(0, maxLength - extension.length - ellipsis.length)

	return begin.trim() + ellipsis + extension
}
