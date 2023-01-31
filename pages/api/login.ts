import type { NextApiRequest, NextApiResponse } from "next"
import { randomBytes } from "crypto"
import { promisify } from "util"
import ConnectDatabase from "../../lib/ConnectDatabase"
import HandleAPIError from "../../helpers/HandleAPIError"
import ValidateSize from "../../helpers/ValidateSize"
import SendAPIError from "../../helpers/SendAPIError"
import UserToken from "../../models/UserToken"
import User, { type AccessTypes } from "../../models/User"

const maxSize = 2**20

async function CreateToken(){
	const buffer = await promisify(randomBytes)(48)
	return buffer.toString("hex")
}

export default async function Login(request: NextApiRequest, response: NextApiResponse){
	const HandleError = HandleAPIError.bind(undefined, response)
	const SendError = SendAPIError.bind(undefined, response)

	if(request.method !== "POST") return HandleError("method")
	if(request.headers["content-type"] !== "application/x-www-form-urlencoded") return HandleError("contentType")
	if(!request.headers["origin"]) return HandleError("origin")
	if(!request.headers["user-agent"]) return HandleError("userAgent")
	if(!ValidateSize(request.headers["content-length"], maxSize)) return HandleError("length")

	async function Register(access: AccessTypes){
		const token = await CreateToken()
		const date = new Date

		date.setMonth(date.getMonth() + 1)

		try{
			await UserToken.create({
				token,
				access,
				expires: date
			})

			response.setHeader("set-cookie", `token=${token}; Expires=${date.toUTCString()}; SameSite=Strict; Secure; HttpOnly`)
			response.status(200).json({ success: true })
		}catch(error){
			console.error(error)
			SendError(500, "Failed to store token")
		}
	}

	function Unauthorize(message?: string){
		SendError(401, message)
	}

	let username: string | undefined, password: string

	await new Promise<void>((resolve, reject) => {
		let data = ""

		request.setEncoding("utf8")
		request.on("data", (chunk: string) => data += chunk)
		request.on("error", reject)

		request.on("end", () => {
			const object = Object.fromEntries(new URLSearchParams(data))

			username = object.username
			password = object.password || ""

			resolve()
		})
	})

	try{
		if(!username) throw "Usuário inválido"

		await ConnectDatabase()

		const user = await User.findOne({ name: username })

		if(user){
			if(user.ValidatePassword(password!)) await Register(user.access)
			else Unauthorize("Senha inválida")
		}else Unauthorize("Usuário inválido")
	}catch(error){
		switch(typeof error){
			case "string": return SendError(400, error)
			case "number": return SendError(error)
		}

		console.error(error)
		SendError(500)
	}
}

export const config = {
	api: {
		bodyParser: false
	}
}
