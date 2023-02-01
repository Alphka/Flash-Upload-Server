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

function CreateConfigHash(content: Buffer){
	return Crypto.createHash("md5").update(content).digest()
}

export const GetCachedConfig = (() => {
	let hash: ReturnType<typeof CreateConfigHash>

	function CheckConfig(content: Buffer){
		const newHash = CreateConfigHash(content)

		if(hash && hash.equals(newHash)) return configData

		hash = newHash
		return configData = JSON.parse(content.toString("utf8")) as Config
	}

	function GetConfig(async: true): Promise<Config>
	function GetConfig(async?: false): Config
	function GetConfig(async?: boolean){
		if(async) return readFile(config).then(CheckConfig)
		return CheckConfig(readFileSync(config))
	}

	return GetConfig
})()
