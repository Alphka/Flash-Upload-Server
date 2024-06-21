import type { Config } from "@typings/database"
import isNumber from "./IsNumber"

function ValidateSize(length: string | number | undefined, { maxFileSize, maxFiles }: Config, mandatory?: boolean): boolean
function ValidateSize(length: string | number | undefined, maxSize: number, mandatory?: boolean): boolean
function ValidateSize(length: string | number | undefined, config: number | Config, mandatory = false){
	if(!isNumber(length)) return !mandatory
	if(typeof length !== "number") length = Number(length)

	return typeof config === "number" ? length <= config : length <= config.maxSize
}

export default ValidateSize
