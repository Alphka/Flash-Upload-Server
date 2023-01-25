import type { NextApiRequest, NextApiResponse } from "next"
import type { APIResponse } from "../../../typings/api"
import type { Config } from "../../../typings/database"
import { GetConfigAsync } from "../../../helpers/Config"
import accepts from "accepts"
import HandleAPIError from "../../../helpers/HandleAPIError"

export default async function Config(request: NextApiRequest, response: NextApiResponse<APIResponse<Config>>){
	const HandleError = HandleAPIError.bind(undefined, response)
	const accept = accepts(request)

	if(request.method !== "GET") return HandleError("method")
	if(!accept.types("json")) return HandleError("accept")

	response.status(200)

	if(process.env.NODE_ENV === "development"){
		response.shouldKeepAlive = false
	}else{
		response.shouldKeepAlive = true
		response.setHeader("Cookie", "private, max-age=5, must-revalidate")
	}

	try{
		response.json({
			success: true,
			data: await GetConfigAsync()
		})
	}catch{
		response.json({
			success: false,
			error: "Failed to get config"
		})
	}
}
