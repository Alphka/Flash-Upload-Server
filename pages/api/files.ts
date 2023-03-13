import type { NextApiRequest, NextApiResponse } from "next"
import type { APIResponse } from "../../typings/api"
import type { IFileLean } from "../../models/typings"
import type { Config } from "../../typings/database"
import HandleAPIError from "../../helpers/HandleAPIError"
import accepts from "accepts"
import File from "../../models/File"

// TODO: Make an api to download each document by the filename

export default async function Config(request: NextApiRequest, response: NextApiResponse<APIResponse<IFileLean[]>>){
	const HandleError = HandleAPIError.bind(undefined, response)
	const accept = accepts(request)

	if(request.method !== "GET") return HandleError("method")
	if(!accept.types("json")) return HandleError("accept")

	response.status(200)

	const files = await File.find({}, { _id: 0, __v: 0 }).lean() as any[]

	files.forEach(file => {
		delete file.content
		file.createdAt = file.createdAt.toISOString()
		file.uploadedAt = file.uploadedAt.toISOString()
	})

	try{
		response.json({
			success: true,
			data: files
		})
	}catch{
		response.json({
			success: false,
			error: "Não foi possível obter as configurações"
		})
	}
}
