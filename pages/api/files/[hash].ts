import type { NextApiRequest, NextApiResponse, PageConfig } from "next"
import type { FileAccess, IFile, IUserToken } from "../../../models/typings"
import type { Document, Types } from "mongoose"
import type { APIResponse } from "../../../typings/api"
import type { IFileData } from "."
import type { Config } from "../../../typings/database"
import { GetCachedConfig } from "../../../helpers/Config"
import ValidateFileAccess from "../../../helpers/ValidateFileAccess"
import ValidateFilename from "../../../helpers/ValidateFilename"
import ConnectDatabase from "../../../lib/ConnectDatabase"
import HandleAPIError from "../../../helpers/HandleAPIError"
import SendAPIError from "../../../helpers/SendAPIError"
import ParseBody from "../../../helpers/ParseBody"
import UserToken from "../../../models/UserToken"
import typeis from "type-is"
import File from "../../../models/File"
import mime from "mime"

type UserDocument = Document<unknown, {}, IUserToken> & Omit<IUserToken & { _id: Types.ObjectId }, never>
type FileDocument = Document<unknown, {}, IFile> & Omit<IFile & { _id: Types.ObjectId }, never>

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

		if(!user) return SendError(401)

		response.setHeader("Access-Control-Allow-Methods", "GET, HEAD, PUT, DELETE")

		const file = await File.findOne({ hash })

		if(!file) return SendError(404, "O documento não foi encontrado")

		switch(request.method){
			case "GET":
			case "HEAD":
				if(user.access !== "all" && file.access === "private") return SendError(403)
				return SendFile(file, request.method, response)
			case "PUT": {
				if(user.access !== "all") return SendError(403)

				const contentType = request.headers["content-type"]
				const config = await GetCachedConfig(true)

				if(!contentType || !typeis.is(contentType, "application/json")) return HandleError("contentType")

				const body = (await ParseBody(request)).toString()
				const data = JSON.parse(body) as IUpdateDocument

				return UpdateDocument(file, data, config, response)
			}
			case "DELETE": return DeleteDocument(file, response)
			default: return SendError(405)
		}
	}catch(error){
		console.error(error)
		SendError(500)
	}
}

async function SendFile(file: FileDocument, method: "GET" | "HEAD", response: NextApiResponse){
	const { content, filename } = file
	let mimeType = mime.getType(filename)

	if(mimeType){
		if(/^text\/[^; ]+$/.test(mimeType)){
			mimeType += "; charset=utf-8"
		}
	}else mimeType = "application/octet-stream"

	response.status(200)
	response.setHeader("Content-Type", mimeType)
	response.setHeader("Content-Length", content.byteLength)
	response.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`)

	if(method === "GET") response.write(content)

	response.end()
}

async function UpdateDocument(file: FileDocument, { filename, access, expireDate, createdDate }: IUpdateDocument, { accessFiles }: Config, response: NextApiResponse<APIResponse>){
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
			const date = new Date(expireDate)
			if(Number.isNaN(date.getTime())) throw "Data de expiração do documento inválida"
			data.expiresAt = date
		}

		if(createdDate){
			const date = new Date(createdDate)
			if(Number.isNaN(date.getTime())) throw "Data de criação do documento inválida"
			data.createdAt = date
		}

		await file.updateOne({ $set: data })

		response.status(200).json({ success: true })
	}catch(error){
		if(typeof error === "string") SendError(400, error)
		else if(error instanceof Error) error.stack = "Falha ao editar informações do documento"

		throw error
	}
}

async function DeleteDocument(file: FileDocument, response: NextApiResponse<APIResponse>){
	const SendError = SendAPIError.bind(undefined, response)

	try{
		await file.deleteOne()
		response.status(200).json({ success: true })
	}catch(error){
		SendError(500, "Falha ao remover o documento")
	}
}

export const config: PageConfig = {
	api: {
		bodyParser: false,
		responseLimit: false
	}
}
