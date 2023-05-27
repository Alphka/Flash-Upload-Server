import type { NextApiRequest, NextApiResponse, PageConfig } from "next"
import type { APIResponse } from "../../../typings/api"
import File from "../../../models/File"
import mime from "mime"

export default async function FileAPI(request: NextApiRequest, response: NextApiResponse<APIResponse>){
	const { method, query: { hash } } = request

	response.setHeader("Access-Control-Allow-Methods", "GET, HEAD")

	if(method !== "GET" && method !== "HEAD") return response.status(405).end()

	const file = await File.findOne({ hash })

	if(!file) return response.status(404).end()

	const { content, filename } = file
	let type = mime.getType(filename)

	if(type){
		if(/^text\/[^; ]+$/.test(type)) type += "; charset=utf-8"
	}else type = "application/octet-stream"

	response.status(200)
	response.setHeader("Content-Type", type)
	response.setHeader("Content-Length", content.byteLength)
	response.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`)

	if(method === "GET") response.write(content)

	response.end()
}

export const config: PageConfig = {
	api: {
		bodyParser: {
			sizeLimit: "500kb"
		}
	}
}
