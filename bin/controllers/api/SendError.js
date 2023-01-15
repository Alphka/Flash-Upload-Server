/**
 * @this {[import("express").Request, import("express").Response]}
 * @param {number} status
 * @param {?string} [statusMessage]
 * @param {?string} [error]
 */
export default function SendError(status, statusMessage, error = undefined){
	const [request, response] = this

	if(response.headersSent){
		console.error(new Error(`API: Could not send error status (${status}) for ${request.url}`))
		return response.json({ success: false })
	}

	status ??= 500

	if(statusMessage) response.statusMessage = statusMessage

	response.status(status)
	response.setHeader("Connection", "close")
	response.setHeader("Cache-Control", "no-store")
	response.json({ success: false, error })
}
