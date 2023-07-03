import type { NextApiRequest, NextApiResponse, PageConfig } from "next"
import type { APIResponseError, APIResponseSuccess } from "../../../typings/api"
import type { Document, FilterQuery, Query } from "mongoose"
import type { IFile } from "../../../models/typings"
import ConnectDatabase from "../../../lib/ConnectDatabase"
import GetDocumentType from "../../../helpers/GetDocumentType"
import HandleAPIError from "../../../helpers/HandleAPIError"
import SendAPIError from "../../../helpers/SendAPIError"
import UserToken from "../../../models/UserToken"
import File from "../../../models/File"

const maxDocumentsPage = 5

export type IFileData = Omit<IFile, "content">

export interface APIFileObject extends IFileData {
	createdAt: string
	uploadedAt: string
	expiresAt: string
}

export interface APIFilesDocumentsResponse extends APIResponseSuccess {
	data: {
		[type: number]: {
			files: APIFileObject[]
			length: number
		}
	}
}

export interface APIFilesResponse extends APIResponseSuccess {
	data: APIFileObject[]
}

export interface APIFilesFolderResponse extends APIResponseSuccess {
	data: {
		type: number
		files: Omit<APIFileObject, "type">[]
	}
}

function GetFiles(query: FilterQuery<IFile>, hasAccess: boolean){
	if(!hasAccess) Object.assign(query, { access: "public" })

	return File.find(query, {
		_id: 0,
		__v: 0,
		content: 0
	}).lean() as Query<IFileData[], Document<unknown, {}, IFileData>, {}, IFileData>
}

function GetFilesObjects(files: IFileData[]){
	return files.map(({ filename, createdAt, uploadedAt, expiresAt, ...data }) => ({
		filename,
		createdAt: new Date(createdAt).toISOString(),
		uploadedAt: new Date(uploadedAt).toISOString(),
		expiresAt: new Date(expiresAt || createdAt).toISOString(),
		...data
	} as APIFileObject))
}

async function SendFolder(response: NextApiResponse<APIFilesFolderResponse>, folder: string, hasAccess: boolean){
	const SendError = SendAPIError.bind(undefined, response)

	if(!folder) return SendError(400, "Tipo de documento inválido")

	const documentType = await GetDocumentType(folder)

	if(!documentType) return SendError(404, "Tipo de documento não encontrado")

	const { id } = documentType
	const files = await GetFiles({ type: id }, hasAccess)

	if(!files.length) return SendError(404)

	const filesObjects = GetFilesObjects(files).map(({ type, ...data }) => data)

	return response.status(200).json({
		success: true,
		data: {
			type: id,
			files: filesObjects
		}
	})
}

async function SendFiles(response: NextApiResponse<APIFilesResponse | APIFilesDocumentsResponse>, hasAccess: boolean, isDocumentsPage = false){
	const SendError = SendAPIError.bind(undefined, response)
	const files = await GetFiles({}, hasAccess)

	if(!files.length) return SendError(404)

	const filesObjects = GetFilesObjects(files)

	response.status(200)

	if(isDocumentsPage){
		const filesMap = new Map<number, {
			files: typeof filesObjects
			length: number
		}>

		filesObjects.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

		for(const file of filesObjects){
			const { type } = file

			if(filesMap.has(type)){
				const { files, length } = filesMap.get(type)!

				if(length >= maxDocumentsPage){
					filesMap.set(type, { files, length: length + 1 })
					continue
				}

				filesMap.set(type, {
					files: [...files, file],
					length: length + 1
				})
			}else filesMap.set(type, {
				files: [file],
				length: 1
			})
		}

		return response.json({
			success: true,
			data: Object.fromEntries(filesMap.entries())
		})
	}

	return response.json({
		success: true,
		data: filesObjects
	})
}

export default async function FilesAPI(request: NextApiRequest, response: NextApiResponse<APIFilesResponse | APIFilesFolderResponse | APIFilesDocumentsResponse | APIResponseError>){
	const token = request.cookies.token || request.headers.authorization
	const HandleError = HandleAPIError.bind(undefined, response)
	const SendError = SendAPIError.bind(undefined, response)
	const { folder, documents } = request.query

	try{
		await ConnectDatabase()

		const user = await UserToken.findOne({ token })

		if(!user) return HandleError(401)

		const hasAccess = user.access === "all"

		switch(typeof folder){
			case "string": return await SendFolder(response, folder, hasAccess)
			case "undefined": return await SendFiles(response, hasAccess, documents === "" || Boolean(documents))
		}

		return SendError(500, "Algo deu errado")
	}catch(error){
		console.error(error)
		SendError(500, "Não foi possível obter os documentos")
	}
}

export const config: PageConfig = {
	api: {
		bodyParser: {
			sizeLimit: "500kb"
		}
	}
}
