// @ts-nocheck

import { copyFileSync, existsSync, readFileSync, writeFileSync } from "fs"
import { copyFile, readFile, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const databaseFolder = join(__dirname, "../../database")
const accountsFile = join(databaseFolder, "accounts.json")
const accountsFileCopy = join(databaseFolder, "accounts.copy.json")

/**
 * @param {import("../../typings/index.js").LoginDatabase} accounts
 * @returns {import("../../typings/index.js").Accounts}
 */
function CreateObject(accounts){
	const object = {
		all: accounts,
		byAccess: {},
		byUsername: {}
	}

	accounts.forEach(login => {
		const { access, username } = login
		object.byAccess[access] = login
		object.byUsername[username] = login
	})

	return object
}

/** @type {import("../../typings/index.js").CreateAccounts} */
const CreateAccounts = (async = false) => {
	if(existsSync(accountsFile)) return async ? Promise.resolve() : undefined
	return (async ? copyFile : copyFileSync)(accountsFileCopy, accountsFile)
}

/** @type {import("../../typings/index.js").GetAccounts} */
export const GetAccounts = (async = false) => {
	if(async) return CreateAccounts(async)
		.then(readFile(accountsFile, "utf8"))
		.then(content => CreateObject(JSON.parse(content)))

	return CreateAccounts(), CreateObject(JSON.parse(readFileSync(accountsFile, "utf8")))
}
