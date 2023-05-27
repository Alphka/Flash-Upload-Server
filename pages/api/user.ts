import type { NextApiRequest, NextApiResponse, PageConfig } from "next"
import type { Config, LoginAccess } from "../../typings/database"
import type { MongoServerError } from "mongodb"
import type { IUser } from "../../models/typings"
import { GetCachedConfig } from "../../helpers/Config"
import ConnectDatabase from "../../lib/ConnectDatabase"
import HandleAPIError from "../../helpers/HandleAPIError"
import ValidateSize from "../../helpers/ValidateSize"
import SendAPIError from "../../helpers/SendAPIError"
import UserToken from "../../models/UserToken"
import typeis from "type-is"
import User from "../../models/User"

const maxSize = 1048576

interface IAddUser {
	username: string
	password: string
	access: LoginAccess
}

interface IUpdateUser {
	username: string
	password: string
}

export default async function UserAPI(request: NextApiRequest, response: NextApiResponse){
	const contentType = request.headers["content-type"]
	const HandleError = HandleAPIError.bind(undefined, response)
	const SendError = SendAPIError.bind(undefined, response)
	const config = await GetCachedConfig(true)

	if(!ValidateSize(request.headers["content-length"], maxSize)) return HandleError("length")
	if(!contentType || !typeis.is(contentType, "application/x-www-form-urlencoded")) return HandleError("contentType")
	if(!request.headers.origin) return HandleError("origin")
	if(!request.headers["user-agent"]) return HandleError("userAgent")

	function ParseBody(){
		let chunks = Buffer.alloc(0)

		return new Promise<Buffer>((resolve, reject) => {
			request.on("data", (chunk: Buffer) => chunks = Buffer.concat([chunks, chunk]))
			request.on("end", () => resolve(chunks))
			request.on("error", reject)
		})
	}

	try{
		await ConnectDatabase()

		switch(request.method){
			case "POST": {
				const body = (await ParseBody()).toString()
				const data = Object.fromEntries(new URLSearchParams(body)) as unknown as IAddUser
				return await AddUser(data, config, request, response)
			}
			case "DELETE": {
				const body = (await ParseBody()).toString()
				const { username } = Object.fromEntries(new URLSearchParams(body)) as { username?: string }
				return await DeleteUser(username, request, response)
			}
			case "PUT": {
				const body = (await ParseBody()).toString()
				const data = Object.fromEntries(new URLSearchParams(body)) as unknown as IUpdateUser
				return await UpdateUser(data, request, response)
			}
			default: return HandleError("method")
		}
	}catch(error){
		const message = error instanceof Error ? error.stack! : String(error)
		SendError(500, message)
	}
}

async function AddUser({ username, password, access }: IAddUser, { accessTypes }: Config, request: NextApiRequest, response: NextApiResponse){
	const SendError = SendAPIError.bind(undefined, response)

	try{
		if(!username || !(username = username.trim())) throw "Usuário inválido"
		if(!password || !(password = password.trim())) throw "Senha inválida"
		if(!access || !(access = access.trim() as LoginAccess) || !accessTypes.includes(access)) throw "Tipo de acesso inválido"

		const userObject: IUser = { name: username, password, access }

		await User.create(userObject)

		response.status(200).json({
			success: true,
			data: userObject
		})
	}catch(error){
		if(typeof error === "string") return SendError(400, error)

		if(error instanceof Error){
			if((error as MongoServerError).code === 11000) error.stack = "Este nome de usuário já existe"
			else error.stack = "Falha ao criar o usuário"
		}

		throw error
	}
}

async function DeleteUser(username: string | undefined, request: NextApiRequest, response: NextApiResponse){
	const SendError = SendAPIError.bind(undefined, response)

	try{
		if(!username || !(username = username.trim())) throw "Usuário inválido"

		const user = await User.findOneAndDelete({ name: username })

		if(user){
			let message: string | undefined

			try{
				await UserToken.deleteMany({ name: username })
			}catch(error){
				console.error(error)
				message = "Falha ao deletar os tokens"
			}

			return response.status(200).json({ success: true, message })
		}

		return SendError(404, "Este usuário não existe")
	}catch(error){
		if(typeof error === "string") return SendError(400, error)

		if(error instanceof Error){
			console.error(error)
			error.stack = "Falha ao remover o usuário"
		}

		throw error
	}
}

async function UpdateUser({ username, password }: IUpdateUser, request: NextApiRequest, response: NextApiResponse){
	const SendError = SendAPIError.bind(undefined, response)

	try{
		if(!username || !(username = username.trim())) throw "Usuário inválido"
		if(!password || !(password = password.trim())) throw "Senha inválida"

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

		if(error instanceof Error){
			console.error(error)
			error.stack = "Falha ao remover o usuário"
		}

		throw error
	}
}

export const config: PageConfig = {
	api: {
		bodyParser: false,
		responseLimit: false
	}
}
