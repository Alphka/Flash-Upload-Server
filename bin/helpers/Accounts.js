// @ts-nocheck

import { copyFileSync, existsSync, readFileSync } from "fs"
import { copyFile, readFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const databaseFolder = join(__dirname, "../../database")
const accountsFile = join(databaseFolder, "accounts.json")
const accountsFileCopy = join(databaseFolder, "accounts.copy.json")

/**
 * @param {import("../../typings/database.js").LoginDatabase} accounts
 * @returns {import("../typings/index.js").Accounts}
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

/** @type {import("../typings/index.js").CreateAccounts} */
const CreateAccounts = (async = false) => {
	if(async){
		if(existsSync(accountsFile)) return Promise.resolve()
		return copyFile(accountsFileCopy, accountsFile)
	}

	if(!existsSync(accountsFile)) copyFileSync(accountsFileCopy, accountsFile)
}


/** @type {import("../typings/index.js").GetAccounts} */
export const GetAccounts = (async = false) => {
	if(async) return CreateAccounts(true)
		.then(() => readFile(accountsFile, "utf8"))
		.then(content => CreateObject(JSON.parse(content)))

	CreateAccounts(false)

	return CreateObject(JSON.parse(readFileSync(accountsFile, "utf8")))
}
