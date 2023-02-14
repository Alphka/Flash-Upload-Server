import type { IncomingMessage, ServerResponse } from "http"

export default function Unauthorize(response: ServerResponse<IncomingMessage>){
	response.setHeader("set-cookie", "token=; Max-Age=0; Path=/; SameSite=Strict")

	return {
		redirect: {
			statusCode: 302,
			destination: "/login"
		}
	} as const
}
