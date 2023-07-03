import type { Config } from "../typings/database"

export default function ValidateFileAccess(access: string, accessFiles: Config["accessFiles"]){
	access = access.toLowerCase()
	return accessFiles.includes(access as typeof accessFiles[number])
}
