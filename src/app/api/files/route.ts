import type {
	FileData,
	APIFileObject,
	APIFilesResponse,
	APIFilesFolderResponse,
	APIFilesDocumentsResponse
} from "./typings"
import type { FilterQuery } from "mongoose"
import type { IFile } from "@models/typings"
import { NextResponse, type NextRequest } from "next/server"
import { GetCachedConfig } from "@helpers/Config"
import ConnectDatabase from "@lib/ConnectDatabase"
import GetDocumentType from "@helpers/GetDocumentType"
import GetAPIAuthToken from "@api/GetAPIAuthToken"
import HandleAPIError from "@api/HandleAPIError"
import SendAPIError from "@api/SendAPIError"
import UserToken from "@models/UserToken"
import File from "@models/File"

const maxDocumentsPage = 5

async function GetFiles(query: FilterQuery<IFile>, hasAdminAccess: boolean){
	if(!hasAdminAccess) Object.assign(query, { access: "public" })

	return await File.find(query, {
		_id: 0,
		__v: 0,
		content: 0
	}).lean() as FileData[]
}

function GetFilesObjects(files: FileData[]){
	return files.map(({ filename, createdAt, uploadedAt, expiresAt, ...data }) => ({
		filename,
		createdAt: new Date(createdAt).toISOString(),
		uploadedAt: new Date(uploadedAt).toISOString(),
		expiresAt: new Date(expiresAt || createdAt).toISOString(),
		...data
	} as APIFileObject))
}

export async function GET(request: NextRequest){
	if(!request.headers.get("user-agent")) return HandleAPIError("userAgent")

	const { nextUrl } = request
	const documents = nextUrl.searchParams.get("documents")?.trim()
	const folder = nextUrl.searchParams.get("folder")?.trim()

	try{
		const token = GetAPIAuthToken(request)

		await ConnectDatabase()

		const user = await UserToken.findOne({ token })

		if(!user) return HandleAPIError(401)

		const hasAdminAccess = user.access === "all"

		// Send all files of a specific folder
		if(typeof folder === "string"){
			if(!folder) return SendAPIError(400, "Tipo de documento inválido")

			const config = await GetCachedConfig(true)
			const documentType = GetDocumentType(config, folder)

			if(!documentType) return SendAPIError(404, "Tipo de documento inválido")

			const { id } = documentType
			const files = await GetFiles({ type: id }, hasAdminAccess)

			if(!files.length) return SendAPIError(404, "A pasta não foi encontrada")

			const filesObjects = GetFilesObjects(files).map(({ type, ...data }) => data)

			return NextResponse.json({
				success: true,
				data: {
					type: id,
					files: filesObjects
				}
			} as APIFilesFolderResponse)
		}

		const isDocumentsPage = typeof documents === "string"
		const files = await GetFiles({}, hasAdminAccess)

		if(!files.length) return SendAPIError(404)

		const filesObjects = GetFilesObjects(files)

		if(!isDocumentsPage) return NextResponse.json({
			success: true,
			data: filesObjects
		} as APIFilesResponse)

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
			}else{
				filesMap.set(type, {
					files: [file],
					length: 1
				})
			}
		}

		return NextResponse.json({
			success: true,
			data: Object.fromEntries(filesMap.entries())
		} as APIFilesDocumentsResponse)
	}catch(error){
		console.error(error)
		return SendAPIError(500, "Não foi possível obter os documentos")
	}
}
