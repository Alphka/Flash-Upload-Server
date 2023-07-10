import type { NextApiRequest, NextApiResponse } from "next"
import type { DocumentTypeInfo } from "../../typings/database"
import type { APIResponse } from "../../typings/api"
import type { FilterQuery } from "mongoose"
import type { IFile } from "../../models/typings"
import { GetCachedConfig } from "../../helpers/Config"
import GetDocumentType from "../../helpers/GetDocumentType"
import ConnectDatabase from "../../lib/ConnectDatabase"
import HandleAPIError from "../../helpers/HandleAPIError"
import GetInputDate from "../../helpers/GetInputDate"
import SendAPIError from "../../helpers/SendAPIError"
import UserToken from "../../models/UserToken"
import File from "../../models/File"

export interface INotificationData {
	hash: string
	folder: DocumentTypeInfo
	filename: string
	expiresAt: string
}

export default async function NotificationsAPI(request: NextApiRequest, response: NextApiResponse<APIResponse<INotificationData[]>>){
	const HandleError = HandleAPIError.bind(undefined, response)
	const SendError = SendAPIError.bind(undefined, response)
	const token = request.cookies.token || request.headers.authorization

	if(request.method !== "GET") return HandleError("method")
	if(!request.headers["user-agent"]) return HandleError("userAgent")

	try{
		await ConnectDatabase()

		const user = await UserToken.findOne({ token })

		if(!user) return SendError(401)

		const config = await GetCachedConfig(true)
		const maxDate = new Date

		maxDate.setDate(maxDate.getDate() + 3)

		const query: FilterQuery<IFile> = {
			expiresAt: {
				$lte: GetInputDate(maxDate)
			}
		}

		if(user.access !== "all") query.access = "public"

		const results = await File.find(query, {
			_id: 0,
			hash: 1,
			type: 1,
			filename: 1,
			expiresAt: 1
		}).lean() as {
			hash: string
			type: number
			filename: string
			expiresAt: string
		}[]

		response.status(200).json({
			data: results.map(({ type, ...data }) => ({
				...data,
				folder: GetDocumentType(config, type)!
			})),
			success: true
		})
	}catch(error){
		console.error(error)
		SendError(500, "Não foi possível efetuar a pesquisa")
	}
}
