import { existsSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import GetNumber from "./GetNumber.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const config = join(__dirname, "../config.json")
const defaultPort = 3000

/** @returns {import("../../typings/index.js").Config} */
function GetConfig(){
	if(existsSync(config)) return JSON.parse(readFileSync(config, "utf8"))
	return {}
}

export function GetPort(){
	if(process.env.PORT) return GetNumber(defaultPort, process.env.PORT)

	if(existsSync(config)){
		const { port } = GetConfig()
		if(port) return port
	}

	return defaultPort
}

/** @param {number} [value] */
export function SetPort(value = GetPort()){
	const object = GetConfig()

	if(object.port !== value){
		writeFileSync(config, JSON.stringify(object, null, "\t") + "\n", "utf8")
	}

	return value
}
