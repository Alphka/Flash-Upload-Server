import { NextResponse } from "next/server"

/** Sets the response status and status code, and sends an error message to the client if there is one */
export default function SendAPIError(status = 500, error?: string | null | undefined, headers?: HeadersInit, statusText?: string){
	headers = new Headers(headers)

	if(!headers.has("connection")) headers.set("Connection", "close")
	if(!headers.has("cache-control")) headers.set("Cache-Control", "no-store")

	return NextResponse.json({
		success: false,
		error
	}, {
		status,
		headers,
		statusText
	})
}
