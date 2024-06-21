import SendAPIError from "./SendAPIError"

type APIErrors =
	| "length"
	| "accept"
	| "origin"
	| "userAgent"
	| "contentType"
	| "method"

/** Handles a custom error and sends a JSON with a helpful HTTP status and error message to the client */
export default function HandleAPIError(error: number | APIErrors, headers?: HeadersInit){
	switch(typeof error){
		case "string": switch(error){
			case "accept":
				return SendAPIError(406, undefined, headers)
			case "origin":
			case "userAgent":
				return SendAPIError(403, undefined, headers)
			case "contentType":
				return SendAPIError(400, "Invalid content type", headers)
			default:
				console.error("Invalid APIError: %s", error)
				return SendAPIError(400, error, headers)
		}
		case "number":
			return SendAPIError(error, undefined, headers)
	}
}
