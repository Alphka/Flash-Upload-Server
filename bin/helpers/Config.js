import { existsSync, readFileSync, writeFileSync } from "fs"
import { readFile, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const databaseFolder = join(__dirname, "../../database")
const config = join(databaseFolder, "config.json")
const configCopy = join(databaseFolder, "config.copy.json")

/** @type {import("../typings/index.js").Config} */
let configData = {}

const ConfigString = () => JSON.stringify(configData, null, "\t") + "\n"

/** @type {import("../typings/index.js").CreateConfig} */
const CreateConfig = (async = false) => {
	if(async) return (async () => {
		if(existsSync(config)) return

		const copyData = await readFile(configCopy, "utf8")
		configData = JSON.parse(copyData)
		await writeFile(config, copyData)
	})()

	if(existsSync(config)) return

	const copyData = readFileSync(configCopy, "utf8")
	configData = JSON.parse(copyData)
	writeFileSync(config, copyData)
}

/** @type {import("../typings/index.js").GetConfig} */
export const GetConfig = (async = false) => {
	if(async) return CreateConfig(true)
		.then(() => readFile(config, "utf8"))
		.then(data => configData = JSON.parse(data))

	return CreateConfig(false), configData = JSON.parse(readFileSync(config, "utf8"))
}

/** @type {import("../typings/index.js").SetConfig} */
export const SetConfig = (data, async = false) => {
	configData = data

	if(async) return CreateConfig(true).then(() => writeFile(config, ConfigString(), "utf8"))

	writeFileSync(config, ConfigString(), "utf8")
}
