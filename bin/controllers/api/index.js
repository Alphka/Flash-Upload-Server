import { AddToken, CreateToken } from "../Token.js"
import { mkdir, writeFile } from "fs/promises"
import { GetAccounts } from "../../helpers/Accounts.js"
import { existsSync } from "fs"
import { Router } from "express"
import { join } from "path"
import Crypto from "crypto"
import IsNumber from "../../helpers/IsNumber.js"

const router = Router()
const accounts = GetAccounts()

/** @param {string | undefined} length */
function ValidateSize(length, mandatory = true){
	if(!IsNumber(length)) return !mandatory
	return Number(length) / 2**20 <= 30
}

/** @param {string | undefined} accept */
function ValidateAccept(accept){
	if(typeof accept !== "string") return false
	return /\btext\/html\b|\*\/\*/.test(accept)
}

router.post("/upload", async (request, response, next) => {
	if(!ValidateSize(request.header("content-length"))) return next("length")
	if(!ValidateAccept(request.header("accept"))) return next("accept")
	if(!request.header("origin")) return next("origin")
	if(!request.header("user-agent")) return next("userAgent")
	if(!request.header("content-type")?.match(/^multipart\/form-data; boundary=/)) return next("contentType")

	const boundary = request.header("content-type").split(";")[1].split("=")[1]
	const initialBoundary = `--${boundary}`
	const finalBoundary = `--${boundary}--`
	const boundaryLength = initialBoundary.length

	let data = Buffer.alloc(0)

	await new Promise((resolve, reject) => {
		request.on("data", chunk => data = Buffer.concat([data, Buffer.from(chunk)]))
		request.on("end", resolve)
		request.on("error", reject)
	})

	/** @type {import("../../../typings/index.js").UploadInfo} */
	const info = {}
	const endIndex = data.indexOf(finalBoundary)

	let boundaryIndex = 0

	while(boundaryIndex !== endIndex){
		const nextBoundaryIndex = data.indexOf(initialBoundary, boundaryIndex + 1)
		const headerIndex = boundaryIndex + boundaryLength + 2
		const headerEndIndex = data.indexOf("\r\n".repeat(2), headerIndex)
		const contentIndex = headerEndIndex + 4
		const contentEndIndex = nextBoundaryIndex - 2
		const headers = data.subarray(headerIndex, headerEndIndex)
		const content = data.subarray(contentIndex, contentEndIndex)

		/** @type {string} */
		let name,
		/** @type {string} */
		filename,
		/** @type {string} */
		type

		for(const line of headers.toString().split("\r\n")){
			const [header, value] = line.split(": ")

			switch(header){
				case "Content-Disposition":
					const values = value.split("; ").slice(1)
					const entries = values.map(disposition => disposition.split("="))

					for(const [key, value] of entries){
						switch(key){
							case "filename":
								filename = JSON.parse(value)
							break
							case "name":
								name = JSON.parse(value)
							break
						}
					}
				break
				case "Content-Type":
					type = value
				break
			}
		}

		switch(name){
			case "file":
				info.file = { filename, type, content }
			break
			case "date":
				info.date = content.toString()
			break
			case "documentType":
				info.documentType = content.toString()
			break
		}

		boundaryIndex = nextBoundaryIndex
	}

	try{
		const { file: { filename, content }, date, documentType } = info

		// TODO!: Create a list of document types in JSON, and verify if it's valid
		// TODO: Organize by sectors
		const folder = join(request.app.get("documentsFolder"), documentType)
		const path = join(folder, filename)

		if(!existsSync(folder)) await mkdir(folder, { recursive: true })

		// TODO: Do something with the file date
		await writeFile(path, content)

		response.status(200).send("Upload successful")
	}catch(error){
		console.error(error)
		response.status(500).send("Upload failed")
	}
})

router.post("/login", async (request, response, next) => {
	if(!request.accepts("json")) return next("accept")
	if(!ValidateSize(request.header("content-length"), false)) return next("length")
	if(request.header("content-type") !== "application/x-www-form-urlencoded") return next("contentType")

	let data = ""

	await new Promise((resolve, reject) => {
		request.on("data", chunk => data += chunk.toString())
		request.on("end", resolve)
		request.on("error", reject)
	})

	const { username, password } = Object.fromEntries(data.split("&").map(entry => {
		const [key, value] = entry.split("=")
		return [key, decodeURIComponent(value)]
	}))

	function Unauthorize(){
		response.status(401)
		response.json({ success: false })
	}

	async function Register(){
		const token = await CreateToken()
		const date = new Date

		date.setMonth(date.getMonth() + 1)

		response.cookie("token", token, {
			maxAge: date.getTime(),
			httpOnly: true,
			sameSite: "lax"
		})

		try{
			await AddToken(token)
			response.status(200).json({ success: true })
		}catch(error){
			response.status(500).json({ success: false, error: "Failed to store token" })
		}
	}

	if(username in accounts.byUsername){
		const login = accounts.byUsername[username]

		if(password){
			const hash = Crypto.createHash("md5").update(password).digest("hex")
			return hash === login.password ? Register() : Unauthorize()
		}

		return login.password ? Unauthorize() : Register()
	}

	return Unauthorize()
})

router.use((error, request, response, next) => {
	/**
	 * @param {number} status
	 * @param {string} [message]
	 */
	function SendError(status, message){
		if(response.headersSent) return console.error(new Error(`API: Could not send error status (${status}) for ${request.url}`)), response.end()
		if(message) response.statusMessage = message
		response.status(status)
		response.end()
	}

	switch(typeof error){
		case "string":
			switch(error){
				case "length": return SendError(411, "File size is too large")
				case "accept": return SendError(406)
				case "origin":
				case "userAgent": return SendError(403)
				case "contentType": return SendError(400)
			}
		break
		case "number": return SendError(error)
	}

	console.error(error), SendError(500)
})

export default router
