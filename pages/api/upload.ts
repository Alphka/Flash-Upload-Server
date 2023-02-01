import type { APIUploadResponse, UploadFileError } from "../../typings/api"
import type { NextApiRequest, NextApiResponse } from "next"
import type { BusboyStream, FilePart } from "../../typings"
import type { Readable } from "stream"
import type { Config } from "../../typings/database"
import { GetCachedConfig } from "../../helpers/Config"
import { extname } from "path"
import ConnectDatabase from "../../lib/ConnectDatabase"
import HandleAPIError from "../../helpers/HandleAPIError"
import ValidateSize from "../../helpers/ValidateSize"
import SendAPIError from "../../helpers/SendAPIError"
import IsNumber from "../../helpers/IsNumber"
import Busboy from "busboy"
import Crypto from "crypto"
import File from "../../models/File"
import axios, { AxiosError } from "axios"

if(!process.env.API_URL) throw new Error("API_URL is not defined")
if(!process.env.API_TOKEN) console.warn("Authentication token is not defined")

function GetTypeById(config: Config, value: number | string | undefined){
	if(!IsNumber(value)) return undefined

	const { types } = config
	const id = Number(value)

	return types.find(type => type.id === id)
}

export default async function Upload(request: NextApiRequest, response: NextApiResponse<APIUploadResponse>){
	const HandleError = HandleAPIError.bind(undefined, response)
	const SendError = SendAPIError.bind(undefined, response)
	const config = await GetCachedConfig(true)

	if(request.method !== "POST") return HandleError("method")
	if(!ValidateSize(request.headers["content-length"], config)) return HandleError("length")
	if(!request.headers["origin"]) return HandleError("origin")
	if(!request.headers["user-agent"]) return HandleError("userAgent")
	if(!request.headers["content-type"]?.startsWith("multipart/form-data; boundary=")) return HandleError("contentType")

	try{
		// TODO: Verify if document is already uploaded
		await ConnectDatabase()

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
				case "date":
					part.date = value
				break
				case "type":
					part.typeId = value
				break
				case "isPrivate":
					part.folder = value === "true" ? "private" : "public"
				break
			}
		})

		busboy.on("file", (name, stream, { filename, mimeType }) => {
			const part = parts.at(-1)

			if(name !== "image") return stream.resume()
			if(!part) return errors.push({ message: `O arquivo '${filename}' não contém informações` })

			part.isFile = true

			filePromises.push((async () => {
				const type = GetTypeById(config, part.typeId)
				const date = part.date ?? new Date
				const extension = extname(filename)

				try{
					if(!type) throw "O tipo de documento não é válido"
					if(!extension) throw "Extensão de arquivo inválida"

					let file = Buffer.alloc(0)

					await new Promise<void>((resolve, reject) => {
						stream.on("error", reject)
						stream.on("data", (chunk: Buffer) => file = Buffer.concat([file, chunk]))
						stream.on("close", () => {
							if((stream as BusboyStream).truncated) return reject("O arquivo é muito grande")
							resolve()
						})
					})

					const hash = Crypto.createHash("sha256").update(file).digest("hex")
					const hashFilename = hash + extension
					const url = new URL(process.env.API_URL!.replace(":file", hashFilename))

					const fileDocument = await File.findOne({ hash })

					if(fileDocument) throw "Este arquivo já foi enviado para o servidor"

					await axios.post<Readable>(url.href, file, {
						headers: {
							Authorization: process.env.API_TOKEN,
							"Content-Type": mimeType
						},
						responseType: "stream"
					}).then(async response => {
						await File.create({
							hash,
							filename,
							createdAt: date,
							uploadedAt: new Date,
							hashFilename,
							access: part.folder ?? "public",
							type: type.id
						})

						uploaded.push(filename)
						response.data.resume()
					}).catch((error: AxiosError) => {
						const { response } = error
						const message = response ? `Request failed: ${response.status} ${response.statusText}` : error.message

						console.error(message)

						throw message
					})
				}catch(error: any){
					if(typeof error === "string"){
						stream.resume()
						errors.push({ message: error, filename })
						return
					}

					console.error(error)
				}
			})())
		})

		for await (const chunk of request){
			busboy.write(chunk)
		}

		busboy.end()

		await new Promise((resolve, reject) => {
			busboy.on("close", resolve)
			busboy.on("error", reject)
		})

		await Promise.all(filePromises)

		response.status(200).json({
			success: true,
			errors,
			uploaded,
			message: uploaded.length
				? `${uploaded.length} ${uploaded.length === 1 ? "arquivo salvo" : "arquivos salvos"} com sucesso`
				: "Nenhum arquivo foi enviado"
		})
	}catch(error){
		if(typeof error === "string"){
			console.error(new Error(error))
			SendError(400, error)
		}

		console.error(error)
		SendError(500, "O envio dos arquivos falhou")
	}
}

export const config = {
    api: {
        bodyParser: false
    }
}
