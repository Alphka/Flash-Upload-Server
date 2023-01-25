import { existsSync, readFileSync, writeFileSync } from "fs"
import { readFile, writeFile } from "fs/promises"
import { Config } from "../typings/database"
import { join } from "path"
import Crypto from "crypto"

const rootFolder = process.cwd()
const databaseFolder = join(rootFolder, "database")
const config = join(databaseFolder, "config.json")
const configCopy = join(databaseFolder, "config.copy.json")

let configData: Config

const ConfigString = () => JSON.stringify(configData, null, "\t") + "\n"

export function CreateConfigSync(){
	if(existsSync(config)) return

	const file = readFileSync(configCopy, "utf8")
	configData = JSON.parse(file)
	writeFileSync(config, file)
}

export async function CreateConfigAsync(){
	if(existsSync(config)) return

	const file = await readFile(configCopy, "utf8")
	configData = JSON.parse(file)
	await writeFile(config, file)
}

export function GetConfigSync(){
	CreateConfigSync()
	return configData = JSON.parse(readFileSync(config, "utf8")) as Config
}

export async function GetConfigAsync(){
	await CreateConfigAsync()
	return configData = JSON.parse(await readFile(config, "utf8")) as Config
}

export function SetConfigSync(data: Config){
	configData = data
	CreateConfigSync()
	writeFileSync(config, ConfigString(), "utf8")
}

export async function SetConfigAsync(data: Config){
	configData = data
	await CreateConfigAsync()
	await writeFile(config, ConfigString(), "utf8")
}

export const GetCachedConfig = (() => {
	let hash: ReturnType<typeof GetHash>

	const GetContent = () => readFileSync(config)
	const GetHash = (content: ReturnType<typeof GetContent>) => Crypto.createHash("md5").update(content).digest()

	return () => {
		const content = GetContent()
		const newHash = GetHash(content)

		if(hash && hash.equals(newHash)) return configData

		return hash = newHash, configData = JSON.parse(content.toString("utf8")) as Config
	}
})()
