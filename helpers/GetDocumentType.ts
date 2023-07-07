import type { Config } from "../typings/database"
import IsNumber from "./IsNumber"

export type DocumentTypeConfig = Config | Pick<Config, "types">

export default function GetDocumentType({ types }: DocumentTypeConfig, folder: number | string){
	if(IsNumber(folder)){
		const id = Number(folder)
		return types.find(type => type.id === id)
	}

	const lowerFolder = (folder as string).toLowerCase()

	return types.find(({ name, reduced }) => (reduced && lowerFolder === reduced.toLowerCase()) || lowerFolder === name.toLowerCase())
}
