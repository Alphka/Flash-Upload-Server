import type { NextApiRequest, NextApiResponse, PageConfig } from "next"
import type { APIResponseError, APIResponseSuccess } from "../../../typings/api"
import type { Document, FilterQuery, Query } from "mongoose"
import type { IFile } from "../../../models/typings"
import { GetCachedConfig } from "../../../helpers/Config"
import ConnectDatabase from "../../../lib/ConnectDatabase"
import HandleAPIError from "../../../helpers/HandleAPIError"
import GetTypeById from "../../../helpers/GetTypeById"
import UserToken from "../../../models/UserToken"
import IsNumber from "../../../helpers/IsNumber"
import File from "../../../models/File"

type IFileData = Omit<IFile, "content">

export interface APIFileObject extends IFileData {
	createdAt: string
	uploadedAt: string
	expiresAt: string
}

export interface APIFilesResponse extends APIResponseSuccess {
	data: {
		[type: number]: APIFileObject
	}
}

export interface APIFilesFolderResponse extends APIResponseSuccess {
	data: {
		type: number
		files: Omit<APIFileObject, "type">[]
	}
}

function GetFiles(query: FilterQuery<IFile> = {}){
	return File.find(query, {
		_id: 0,
		__v: 0,
		content: 0
	}).lean() as Query<IFileData[], Document<unknown, {}, IFileData>, {}, IFileData>
}

function GetFilesObjects(files: IFileData[], hasAccess = false){
	return files.map(({ filename, createdAt, uploadedAt, expiresAt, ...data }) => ({
		filename: data.access === "private" ? (hasAccess ? filename : "Arquivo privado") : filename,
		createdAt: new Date(createdAt).toISOString(),
		uploadedAt: new Date(uploadedAt).toISOString(),
		expiresAt: new Date(expiresAt || createdAt).toISOString(),
		...data
	} as APIFileObject))
}

export default async function FilesAPI(request: NextApiRequest, response: NextApiResponse<APIFilesResponse | APIFilesFolderResponse | APIResponseError>){
	const token = request.cookies.token || request.headers.authorization
	const HandleError = HandleAPIError.bind(undefined, response)
	const { query: { folder } } = request

	try{
		await ConnectDatabase()

		const user = await UserToken.findOne({ token })

		if(!user) return HandleError(401)

		response.status(200)

		if(!folder) return response.json({
			success: true,
			data: GetFilesObjects(await GetFiles(), user.access === "all")
		})

		if(typeof folder !== "string") return response.json({
			success: false,
			error: "Algo deu errado"
		})

		const config = await GetCachedConfig(true)
		const documentType = IsNumber(folder)
			? GetTypeById(config, Number(folder))
			: Object.values(config.types).find(({ name, reduced }) => (reduced && folder.toLowerCase() === reduced.toLowerCase()) || folder.toLowerCase() === name.toLowerCase())

		if(!documentType) return response.json({
			success: false,
			error: "Tipo de documento inválido"
		})

		const { id } = documentType

		return response.json({
			success: true,
			data: {
				type: id,
				files: GetFilesObjects(await GetFiles({ type: id })).map(({ type, ...data }) => data)
			}
		})
	}catch(error){
		console.error(error)

		response.json({
			success: false,
			error: "Não foi possível obter os documentos"
		})
	}
}

export const config: PageConfig = {
	api: {
		bodyParser: {
			sizeLimit: "500kb"
		}
	}
}
