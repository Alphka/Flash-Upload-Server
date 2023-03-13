import type { Config } from "../typings/database"
import IsNumber from "./IsNumber"

export default function GetTypeById(config: Config, value: number | string | undefined){
	if(!IsNumber(value)) return undefined

	const { types } = config
	const id = Number(value)

	return types.find(type => type.id === id)
}
