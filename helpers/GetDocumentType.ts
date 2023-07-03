import { GetCachedConfig } from "./Config"
import GetTypeById from "./GetTypeById"
import IsNumber from "./IsNumber"

export default async function GetDocumentType(folder: string){
	const config = await GetCachedConfig(true)

	return IsNumber(folder)
		? GetTypeById(config, Number(folder))
		: Object.values(config.types).find(({ name, reduced }) => (reduced && folder.toLowerCase() === reduced.toLowerCase()) || folder.toLowerCase() === name.toLowerCase())
}
