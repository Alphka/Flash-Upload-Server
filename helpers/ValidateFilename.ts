export default function ValidateFilename(filename: string){
	return filename.length < 125 && !/[:*?<>~#%\&{}+\|\\\/]|\.\.|^\.|\.$|^ | $/.test(filename)
}
