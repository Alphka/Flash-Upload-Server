import type { NextApiResponse } from "next"
import SendAPIError from "./SendAPIError"

type APIErrors =
	| "length"
	| "accept"
	| "origin"
	| "userAgent"
	| "contentType"
	| "method"

export default function HandleAPIError(response: NextApiResponse, error: number | APIErrors | Error){
	const SendError = SendAPIError.bind(undefined, response)

	switch(typeof error){
		case "string": switch(error){
			case "method": return SendError(405)
			case "length": return SendError(413, "File size is too large")
			case "accept": return SendError(406)
			case "origin":
			case "userAgent": return SendError(403)
			case "contentType": return SendError(400, "Invalid content type")
		}
		case "number": return SendError(error)
	}

	console.error(error)
	SendError(500)
}
