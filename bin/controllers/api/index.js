import { createWriteStream, existsSync } from "fs"
import { AddToken, CreateToken } from "../Token.js"
import { GetAccounts } from "../../helpers/Accounts.js"
import { Router } from "express"
import { mkdir } from "fs/promises"
import { join } from "path"
import Crypto from "crypto"
import Busboy from "busboy"
import IsNumber from "../../helpers/IsNumber.js"
import SendError from "./SendError.js"

const router = Router()
const accounts = GetAccounts()

/**
 * @param {string | undefined} length
 * @param {import("../../../typings/database.js").Config} config
 * @param {boolean} [mandatory]
 */
function ValidateSize(length, { maxFileSize, maxFiles }, mandatory = true){
	if(!IsNumber(length)) return !mandatory
	return Number(length) <= maxFileSize * maxFiles + 1048576
}

/** @param {string | Date} date */
function GetFormattedDate(date){
	if(typeof date === "string") date = new Date(date)
	return date.toLocaleDateString("pt-BR").replaceAll("/", "")
}

router.get("/config/types", (request, response) => {
	if(!request.accepts("json")) return SendError.call([request, response], 406)

	response.status(200)

	if(request.app.get("development")) response.shouldKeepAlive = false
	else{
		response.shouldKeepAlive = true
		response.setHeader("Cookie", "private, max-age=5, must-revalidate")
	}

	response.json({
		success: true,
		data: request.app.get("config").types
	})
})

router.post("/upload", async (request, response, next) => {
	/** @type {import("../../../typings/database.js").Config} */
	const config = request.app.get("config")

	if(!ValidateSize(request.header("content-length"), config)) return next("length")
	if(!request.header("origin")) return next("origin")
	if(!request.header("user-agent")) return next("userAgent")
	if(!request.header("content-type")?.match(/^multipart\/form-data; boundary=/)) return next("contentType")

	const documentsFolder = request.app.get("documentsFolder")

	/** @param {number | string} value */
	function GetTypeById(value){
		if(!IsNumber(value)) return undefined

		const { types } = config
		const id = Number(value)
		return types.find(type => type.id === id)
	}

	try{
		// TODO: Make an api route to send this to the client
		const { maxFileSize, maxFiles } = config

		const busboy = Busboy({
			headers: request.headers,
			limits: {
				files: maxFiles,
				fileSize: maxFileSize
			},
			defCharset: "utf8",
			defParamCharset: "utf8"
		})

		/** @type {import("../../typings/index.js").FilePart[]} */
		const parts = []
		/** @type {import("../../typings/index.js").UploadFileError[]} */
		const errors = []
		/** @type {string[]} */
		const uploaded = []
		/** @type {Promise<any>[]} */
		const filePromises = []

		busboy.on("field", (name, value) => {
			const part = (() => {
				const lastPart = parts.at(-1)

				function CreatePart(){
					/** @type {import("../../typings/index.js").FilePart} */
					const part = {}
					parts.push(part)
					return part
				}

				if(lastPart) return lastPart.isFile ? CreatePart() : lastPart
				else return CreatePart()
			})()

			const fieldEnum = {
				date: () => part.date = GetFormattedDate(value),
				type: () => part.typeId = value,
				isPrivate: () => part.folder = value === "true" ? "private" : "public"
			}

			fieldEnum[name]?.()
		})

		/**
		 * @param {import("../../typings/index.js").FilePart} part
		 * @param {import("../../../typings/index.js").BusboyStream} stream
		 * @param {string} filename
		 */
		async function FilePromise(part, stream, filename){
			try{
				const { typeId } = part
				const type = GetTypeById(typeId)

				if(!type) throw "O tipo de documento não é válido"

				let { folder, date } = part

				if(!folder) folder = part.folder = "public"
				if(!date) date = part.date = GetFormattedDate(new Date)

				const directory = join(documentsFolder, folder, type.reduced || type.name)
				const path = join(directory, `${date}_${filename}`)

				if(!existsSync(directory)) await mkdir(directory, { recursive: true })

				await new Promise((resolve, reject) => {
					const fileStream = createWriteStream(path)

					stream.pipe(fileStream)

					fileStream.on("finish", () => {
						if(stream.truncated) reject("O arquivo é muito grande")
						resolve()
					})

					fileStream.on("error", reject)
				})

				uploaded.push(filename)
			}catch(error){
				if(typeof error === "string"){
					errors.push({
						message: error,
						filename
					})

					return stream.resume()
				}

				console.error(error)
			}
		}

		busboy.on("file", (name, stream, { filename }) => {
			const part = parts.at(-1)

			if(!part) return errors.push({ message: `O arquivo '${filename}' não contém informações` })
			if(name !== "image") return stream.resume()

			part.isFile = true

			filePromises.push(FilePromise(part, stream, filename))
		})

		request.pipe(busboy)

		await new Promise((resolve, reject) => {
			busboy.on("close", resolve)
			busboy.on("error", reject)
		})

		await Promise.all(filePromises)

		response.status(200).json({
			success: true,
			errors,
			uploaded,
			message: "Upload successful"
		})
	}catch(error){
		const args = [request, response]

		if(typeof error === "string"){
			console.error(new Error(error))
			SendError.call(args, 400, null, error)
		}

		console.error(error)
		SendError.call(args, 500, null, "Upload failed")
	}
})

router.post("/login", async (request, response, next) => {
	const config = request.app.get("config")

	if(!request.accepts("json")) return next("accept")
	if(!ValidateSize(request.header("content-length"), config)) return next("length")
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
			const message = "Failed to store token"
			console.error(new Error(message))
			SendError.call([request, response], 500, null, message)
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
	const args = [request, response]

	switch(typeof error){
		case "string":
			switch(error){
				case "length": return SendError.call(args, 413, null, "File size is too large")
				case "accept": return SendError.call(args, 406)
				case "origin":
				case "userAgent": return SendError.call(args, 403)
				case "contentType": return SendError.call(args, 400)
			}
		break
		case "number": return SendError.call(args, error)
	}

	console.error(error), SendError.call(args, 500)
})

export default router
