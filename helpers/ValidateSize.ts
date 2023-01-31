import type { Config } from "../typings/database"
import IsNumber from "./IsNumber"

function ValidateSize(length: string | undefined, { maxFileSize, maxFiles }: Config, mandatory?: boolean): boolean
function ValidateSize(length: string | undefined, maxSize: number, mandatory?: boolean): boolean
function ValidateSize(length: string | undefined, config: number | Config, mandatory = true){
	if(!IsNumber(length)) return !mandatory

	const _length = Number(length)

	if(typeof config === "number"){
		return _length <= config
	}

	const { maxFileSize, maxFiles } = config

	return _length <= maxFileSize * maxFiles + 1048576
}

export default ValidateSize
