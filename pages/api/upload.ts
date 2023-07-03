import type { NextApiRequest, NextApiResponse, PageConfig } from "next"
import type { APIUploadResponse, UploadFileError } from "../../typings/api"
import type { BusboyStream, FilePart } from "../../typings"
import type { FileAccess } from "../../models/typings"
import { GetCachedConfig } from "../../helpers/Config"
import { extname } from "path"
import ConnectDatabase from "../../lib/ConnectDatabase"
import HandleAPIError from "../../helpers/HandleAPIError"
import ValidateSize from "../../helpers/ValidateSize"
import SendAPIError from "../../helpers/SendAPIError"
import GetTypeById from "../../helpers/GetTypeById"
import UserToken from "../../models/UserToken"
import IsNumber from "../../helpers/IsNumber"
import Busboy from "busboy"
import Crypto from "crypto"
import File from "../../models/File"

interface FileData {
	hash: string
	filename: string
	createdAt: Date
	expiresAt: Date
	access: FileAccess
	typeId: number
	extension?: string
}

async function UploadFile(file: Buffer, { hash, filename, createdAt, expiresAt, access, typeId, extension }: FileData){
	extension ??= extname(filename)

	await File.create({
		content: file,
		hash,
		access,
		filename,
		expiresAt,
		createdAt,
		uploadedAt: new Date,
		hashFilename: hash + extension,
		type: typeId
	})
}

export default async function Upload(request: NextApiRequest, response: NextApiResponse<APIUploadResponse>){
	const HandleError = HandleAPIError.bind(undefined, response)
	const SendError = SendAPIError.bind(undefined, response)
	const token = request.cookies.token || request.headers.authorization
	const config = await GetCachedConfig(true)

	if(request.method !== "POST") return HandleError("method")
	if(!ValidateSize(request.headers["content-length"], config)) return HandleError("length")
	if(!request.headers["origin"]) return HandleError("origin")
	if(!request.headers["user-agent"]) return HandleError("userAgent")
	if(!request.headers["content-type"]?.startsWith("multipart/form-data; boundary=")) return HandleError("contentType")

	try{
		await ConnectDatabase()

		const user = await UserToken.findOne({ token })

		if(!user) return HandleError(401)

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
		const uploaded = new Array<number>
		const filePromises = new Array<Promise<any>>

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
				case "id":
					part.id = value
				break
				case "date":
					part.date = value
				break
				case "expire":
					part.expire = value
				break
				case "type":
					part.typeId = value
				break
				case "isPrivate":
					part.folder = value === "true" ? "private" : "public"
				break
			}
		})

		busboy.on("file", (name, stream, { filename }) => {
			const part = parts.at(-1)

			if(name !== "image") return stream.resume()
			if(!part) return errors.push({ message: `O arquivo '${filename}' não contém informações` })

			part.isFile = true

			filePromises.push((async () => {
				const id = IsNumber(part.id) ? Number(part.id) : part.id === "0" ? 0 : undefined
				const date = part.date && new Date(part.date)
				const expire = part.expire && new Date(part.expire)
				const type = part.typeId && GetTypeById(config, part.typeId)
				const extension = filename && extname(filename)

				try{
					if(!id && id !== 0) throw "ID do documento inválido"
					if(!date) throw "Data de criação inválida"
					if(!expire) throw "Data de expiração inválida"
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
					const fileDocument = await File.findOne({ hash })

					if(fileDocument) throw "Este arquivo já foi enviado para o servidor"
					if(part.folder === "private" && user.access !== "all") throw "Você não tem permissão para enviar um arquivo privado"

					await UploadFile(file, {
						hash,
						filename,
						createdAt: date,
						expiresAt: expire,
						access: part.folder as FileAccess || "public",
						typeId: type.id,
						extension
					})

					uploaded.push(id)
				}catch(error: any){
					if(typeof error === "string"){
						stream.resume()
						errors.push({ message: error, id })
						return
					}

					console.error(error)
				}
			})())
		})

		await new Promise(async (resolve, reject) => {
			busboy.on("close", resolve)
			busboy.on("error", reject)

			for await (const chunk of request){
				busboy.write(chunk)
			}

			busboy.end()
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

export const config: PageConfig = {
    api: {
        bodyParser: false,
		responseLimit: false
    }
}
