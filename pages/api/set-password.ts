import type { NextApiRequest, NextApiResponse, PageConfig } from "next"
import { GetCachedConfig } from "../../helpers/Config"
import ConnectDatabase from "../../lib/ConnectDatabase"
import HandleAPIError from "../../helpers/HandleAPIError"
import SendAPIError from "../../helpers/SendAPIError"
import ValidateSize from "../../helpers/ValidateSize"
import typeis from "type-is"
import User from "../../models/User"

const maxSize = 5 * 1024

interface ISetPassword {
	username: string
	password: string
}

export default async function SetPasswordAPI(request: NextApiRequest, response: NextApiResponse){
	const HandleError = HandleAPIError.bind(undefined, response)
	const SendError = SendAPIError.bind(undefined, response)

	if(!ValidateSize(request.headers["content-length"], maxSize)) return HandleError("length")
	if(!typeis(request, ["application/x-www-form-urlencoded"])) return HandleError("contentType")
	if(request.method !== "POST") return HandleError("method")
	if(!request.headers["origin"]) return HandleError("origin")
	if(!request.headers["user-agent"]) return HandleError("userAgent")

	function ParseBody(){
		return new Promise<Buffer>((resolve, reject) => {
			let chunks = Buffer.alloc(0)
			request.on("error", reject)
			request.on("data", (chunk: Buffer) => chunks = Buffer.concat([chunks, chunk]))
			request.on("end", () => resolve(chunks))
		})
	}

	try{
		const body = (await ParseBody()).toString()
		let { username, password } = Object.fromEntries(new URLSearchParams(body)) as unknown as ISetPassword

		if(!username || !(username = username.trim())) throw "Usuário inválido"
		if(!password || !(password = password.trim())) throw "Senha inválida"

		await ConnectDatabase()

		const user = await User.findOne({ name: username })

		if(user){
			try{
				await user.updateOne({ $set: { password } })
				response.status(200).json({ success: true })
			}catch{
				response.status(500).json({ success: false, message: "Erro ao atualizar informações do usuário" })
			}

			return
		}

		response.status(404).json({ success: false, message: "Usuário não encontrado" })
	}catch(error){
		if(typeof error === "string") return SendError(400, error)

		const message = error instanceof Error ? error.stack! : String(error)
		SendError(500, message)
	}
}

export const config: PageConfig = {
	api: {
		bodyParser: false,
		responseLimit: false
	}
}
