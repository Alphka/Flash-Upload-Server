import type { NextApiResponse } from "next"
import SendError from "./SendAPIError"

type APIErrors =
	| "length"
	| "accept"
	| "origin"
	| "userAgent"
	| "contentType"

export default function HandleAPIError(response: NextApiResponse, error: number | APIErrors | Error){
	switch(typeof error){
		case "string":
			switch(error){
				case "length": return SendError(response, 413, null, "File size is too large")
				case "accept": return SendError(response, 406)
				case "origin":
				case "userAgent": return SendError(response, 403)
				case "contentType": return SendError(response, 400)
			}
		break
		case "number": return SendError(response, error)
	}

	console.error(error)
	SendError(response, 500)
}
