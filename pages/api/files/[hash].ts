import type { NextApiRequest, NextApiResponse, PageConfig } from "next"
import type { FileAccess, IFile, IUserToken } from "../../../models/typings"
import type { Document, Types } from "mongoose"
import type { APIResponse } from "../../../typings/api"
import ConnectDatabase from "../../../lib/ConnectDatabase"
import SendAPIError from "../../../helpers/SendAPIError"
import UserToken from "../../../models/UserToken"
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

export const config: PageConfig = {
	api: {
		bodyParser: false,
		responseLimit: false
	}
}
