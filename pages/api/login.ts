import type { NextApiRequest, NextApiResponse, PageConfig } from "next"
import type { AccessTypes } from "../../typings/database"
import { randomBytes } from "crypto"
import ConnectDatabase from "../../lib/ConnectDatabase"
import HandleAPIError from "../../helpers/HandleAPIError"
import ValidateSize from "../../helpers/ValidateSize"
import SendAPIError from "../../helpers/SendAPIError"
import UserToken from "../../models/UserToken"
import User from "../../models/User"

const maxSize = 1048576

function CreateToken(){
	return new Promise<string>((resolve, reject) => randomBytes(48, (error, buffer) => {
		if(error) return reject(error)
		resolve(buffer.toString("hex"))
	}))
}

export default async function Login(request: NextApiRequest, response: NextApiResponse){
	const HandleError = HandleAPIError.bind(undefined, response)
	const SendError = SendAPIError.bind(undefined, response)

	if(request.method !== "POST") return HandleError("method")
	if(request.headers["content-type"] !== "application/x-www-form-urlencoded") return HandleError("contentType")
	if(!request.headers["origin"]) return HandleError("origin")
	if(!request.headers["user-agent"]) return HandleError("userAgent")
	if(!ValidateSize(request.headers["content-length"], maxSize)) return HandleError("length")

	async function Register(name: string, access: AccessTypes){
		const oldToken = request.cookies.token

		if(oldToken){
			try{
				await UserToken.findOneAndDelete({ token: oldToken })
			}catch(error){
				console.error(error)
			}
		}

		const token = await CreateToken()
		const date = new Date

		date.setMonth(date.getMonth() + 1)

		try{
			await UserToken.create({
				name,
				token,
				access,
				expires: date
			})

			response.setHeader("set-cookie", `token=${token}; Expires=${date.toUTCString()}; Path=/; SameSite=Strict`)
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
			if(user.ValidatePassword(password!)) await Register(username, user.access)
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

export const config: PageConfig = {
	api: {
		bodyParser: false,
		responseLimit: false
	}
}
