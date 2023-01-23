import type { APIUploadResponse, UploadFileError } from "../../typings/api"
import type { NextApiRequest, NextApiResponse } from "next"
import type { BusboyStream, FilePart } from "../../typings"
import type { Config } from "../../typings/database"
import { createWriteStream, existsSync } from "fs"
import { GetCachedConfig } from "../../helpers/Config"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { mkdir } from "fs/promises"
import ValidateSize from "../../helpers/ValidateSize"
import HandleAPIError from "../../helpers/HandleAPIError"
import SendError from "../../helpers/SendAPIError"
import IsNumber from "../../helpers/IsNumber"
import Busboy from "busboy"

const rootFolder = join(dirname(fileURLToPath(import.meta.url)), "../..")
const documentsFolder = join(rootFolder, "documents")

function GetTypeById(config: Config, value: number | string | undefined){
	if(!IsNumber(value)) return undefined

	const { types } = config
	const id = Number(value)

	return types.find(type => type.id === id)
}

function GetFormattedDate(date: string | Date){
	if(typeof date === "string") date = new Date(date)
	return date.toLocaleDateString("pt-BR").replaceAll("/", "")
}

export default async function Upload(request: NextApiRequest, response: NextApiResponse<APIUploadResponse>){
	const HandleError = HandleAPIError.bind(undefined, response)
	const config = GetCachedConfig()

	if(!ValidateSize(request.headers["content-length"], config)) return HandleError("length")
	if(!request.headers["origin"]) return HandleError("origin")
	if(!request.headers["user-agent"]) return HandleError("userAgent")
	if(!request.headers["content-type"]?.startsWith("multipart/form-data; boundary=")) return HandleError("contentType")

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

		const parts = new Array<FilePart>
		const errors = new Array<UploadFileError>
		const uploaded = new Array<string>
		const filePromises = new Array as Promise<any>[]

		function GetLastPart(){
			const lastPart = parts.at(-1)

			function CreatePart(){
				const part: FilePart = {}
				return parts.push(part), part
			}

			return lastPart ? lastPart.isFile ? CreatePart() : lastPart : CreatePart()
		}

		busboy.on("field", (name, value) => {
			const part = GetLastPart()

			switch(name){
				case "name":
					part.date = GetFormattedDate(value)
				break
				case "type":
					part.typeId = value
				break
				case "isPrivate":
					part.folder = value === "true" ? "private" : "public"
				break
			}
		})

		async function FilePromise(part: FilePart, stream: BusboyStream, filename: string){
			let { typeId, folder, date } = part
			const type = GetTypeById(config, typeId)

			try{
				if(!type) throw "O tipo de documento não é válido"
				if(!folder) folder = part.folder = "public"
				if(!date) date = part.date = GetFormattedDate(new Date)

				const directory = join(documentsFolder, folder, type.reduced || type.name)
				const path = join(directory, `${date}_${filename}`)

				if(!existsSync(directory)) await mkdir(directory, { recursive: true })

				await new Promise<void>((resolve, reject) => {
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
					stream.resume()

					errors.push({
						message: error,
						filename
					})

					return
				}

				console.error(error)
			}
		}

		busboy.on("file", (name, stream, { filename }) => {
			const part = parts.at(-1)

			if(name !== "image") return stream.resume()
			if(!part) return errors.push({ message: `O arquivo '${filename}' não contém informações` })

			part.isFile = true
			filePromises.push(FilePromise(part, stream as BusboyStream, filename))
		})

		await new Promise((resolve, reject) => {
			busboy.end(request.body)
			busboy.on("close", resolve)
			busboy.on("error", reject)
		})

		await Promise.all(filePromises)

		response.status(200).json({
			success: true,
			errors,
			uploaded,
			message: `${uploaded.length} ${uploaded.length === 1 ? "arquivo salvo" : "arquivos salvos"} com sucesso`
		})
	}catch(error){
		if(typeof error === "string"){
			console.error(new Error(error))
			SendError(response, 400, null, error)
		}

		console.error(error)
		SendError(response, 500, null, "O envio dos arquivos falhou")
	}
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: "500mb"
        }
    }
}
