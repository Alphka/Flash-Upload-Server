import type { NextApiResponse } from "next"

export default function SendError(response: NextApiResponse, status = 500, statusMessage?: string | null, error: string | undefined = undefined){
	if(statusMessage) response.statusMessage = statusMessage

	response.shouldKeepAlive = false
	response.status(status)
	response.setHeader("Cache-Control", "no-store")
	response.json({ success: false, error })
}
