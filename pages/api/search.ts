import type { NextApiRequest, NextApiResponse } from "next"
import type { APIResponse } from "../../typings/api"
import ConnectDatabase from "../../lib/ConnectDatabase"
import HandleAPIError from "../../helpers/HandleAPIError"
import SendAPIError from "../../helpers/SendAPIError"
import UserToken from "../../models/UserToken"
import File from "../../models/File"

export default async function SearchAPI(request: NextApiRequest, response: NextApiResponse<APIResponse>){
	const token = request.cookies.token || request.headers.authorization
	const HandleError = HandleAPIError.bind(undefined, response)
	const SendError = SendAPIError.bind(undefined, response)
	const { query: { q: search } } = request

	if(request.method !== "GET") return HandleError("method")
	if(!request.headers["user-agent"]) return HandleError("userAgent")

	if(!search || Array.isArray(search)) return HandleError(400)

	try{
		await ConnectDatabase()

		const user = await UserToken.findOne({ token })

		if(!user) return HandleError(401)

		const results = await File.find({
			filename: {
				$regex: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
			}
		}, {
			_id: 0,
			__v: 0,
			content: 0
		}).lean()

		response.status(200).json({
			success: true,
			data: results
		})
	}catch(error){
		console.error(error)
		SendError(500, "Não foi possível efetuar a pesquisa")
	}
}
