import type { NextApiResponse } from "next"

export default function SendAPIError(response: NextApiResponse, status = 500, error: string | null | undefined = undefined, statusMessage?: string){
	if(statusMessage) response.statusMessage = statusMessage

	response.shouldKeepAlive = false
	response.status(status)
	response.setHeader("Cache-Control", "no-store")
	response.json({ success: false, error })
}
