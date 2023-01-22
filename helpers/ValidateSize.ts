import type { Config } from "../typings/database"
import IsNumber from "./IsNumber"

export default function ValidateSize(length: string | undefined, { maxFileSize, maxFiles }: Config, mandatory = true){
	if(!IsNumber(length)) return !mandatory
	return Number(length) <= maxFileSize * maxFiles + 1048576
}
