import type { NextApiRequest, NextApiResponse, PageConfig } from "next"
import type { APIResponse } from "../../../typings/api"
import type { FileAccess } from "../../../models/typings"
import type { IFileData } from "."
import type { Config } from "../../../typings/database"
import { GetCachedConfig } from "../../../helpers/Config"
import ValidateFileAccess from "../../../helpers/ValidateFileAccess"
import ValidateInputDate from "../../../helpers/ValidateInputDate"
import ValidateFilename from "../../../helpers/ValidateFilename"
import ConnectDatabase from "../../../lib/ConnectDatabase"
import HandleAPIError from "../../../helpers/HandleAPIError"
import SendAPIError from "../../../helpers/SendAPIError"
import ParseBody from "../../../helpers/ParseBody"
import UserToken from "../../../models/UserToken"
import typeis from "type-is"
import File from "../../../models/File"
import mime from "mime"

export interface IUpdateDocument {
	filename?: string
	createdDate?: string
	expireDate?: string
	access?: FileAccess
}

export default async function FileAPI(request: NextApiRequest, response: NextApiResponse<APIResponse>){
	const HandleError = HandleAPIError.bind(undefined, response)
	const SendError = SendAPIError.bind(undefined, response)
	const token = request.cookies.token || request.headers.authorization
	const hash = request.query.hash as string

	try{
		await ConnectDatabase()

		const user = await UserToken.findOne({ token })

		if(!user) return response.status(401).end()

		response.setHeader("Access-Control-Allow-Methods", "GET, HEAD, PUT")

		switch(request.method){
			case "GET":
			case "HEAD": break
			case "PUT": {
				const contentType = request.headers["content-type"]
				const config = await GetCachedConfig(true)

				if(!contentType || !typeis.is(contentType, "application/json")) return HandleError("contentType")

				const body = (await ParseBody(request)).toString()
				const data = JSON.parse(body) as IUpdateDocument

				return UpdateDocument(hash, data, config, response)
			}
			default: return SendError(405)
		}

		const file = await File.findOne({ hash })

		if(!file) return SendError(404)

		if(file.access === "private" && user.access !== "all") return SendError(403)

		const { content, filename } = file
		let type = mime.getType(filename)

		if(type){
			if(/^text\/[^; ]+$/.test(type)) type += "; charset=utf-8"
		}else type = "application/octet-stream"

		response.status(200)
		response.setHeader("Content-Type", type)
		response.setHeader("Content-Length", content.byteLength)
		response.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`)

		if(request.method === "GET") response.write(content)

		response.end()
	}catch(error){
		console.error(error)
		return SendError(500)
	}
}

async function UpdateDocument(hash: string, { filename, access, expireDate, createdDate }: IUpdateDocument, { accessFiles }: Config, response: NextApiResponse){
	const SendError = SendAPIError.bind(undefined, response)
	const data = {} as IFileData

	try{
		if(filename){
			if(!ValidateFilename(filename)) throw "Nome do documento inválido"
			data.filename = filename
		}

		if(access){
			if(!ValidateFileAccess(access, accessFiles)) throw "Tipo de acesso do documento inválido"
			data.access = access
		}

		if(expireDate){
			if(!ValidateInputDate(expireDate)) throw "Data de expiração do documento inválida"
			data.expiresAt = expireDate
		}

		if(createdDate){
			if(!ValidateInputDate(createdDate)) throw "Data de criação do documento inválida"
			data.createdAt = createdDate
		}

		const file = await File.findOne({ hash })

		if(!file) return SendError(404, "O documento não foi encontrado")

		await file.updateOne({ $set: data })

		return response.status(200).json({ success: true })
	}catch(error){
		if(typeof error === "string") return SendError(400, error)
		if(error instanceof Error) error.stack = "Falha ao editar informações do documento"
		throw error
	}
}

export const config: PageConfig = {
	api: {
		bodyParser: false,
		responseLimit: false
	}
}
