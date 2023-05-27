import type { IncomingMessage } from "http"

export default function getBaseURL(request: IncomingMessage){
	const protocol = request.headers["x-forwarded-proto"] || "http"
	const host = request.headers.host
	return `${protocol}://${host}`
}
