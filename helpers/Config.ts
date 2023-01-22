import { existsSync, readFileSync, writeFileSync } from "fs"
import { readFile, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { Config } from "../typings/database"

const rootFolder = join(dirname(fileURLToPath(import.meta.url)), "..")
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
