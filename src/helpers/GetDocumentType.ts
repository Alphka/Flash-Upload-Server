import type { Config } from "@typings/database"
import isNumber from "./IsNumber"

export type DocumentTypeConfig = Pick<Config, "types">

export default function GetDocumentType({ types }: DocumentTypeConfig, folder: number | string){
	if(isNumber(folder)){
		const id = Number(folder)
		return types.find(type => type.id === id)
	}

	const lowerFolder = (folder as string).toLowerCase()

	return types.find(({ name, reduced }) => (reduced && lowerFolder === reduced.toLowerCase()) || lowerFolder === name.toLowerCase())
}
