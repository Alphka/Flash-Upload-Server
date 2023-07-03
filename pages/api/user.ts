import type { NextApiRequest, NextApiResponse, PageConfig } from "next"
import type { Config, AccessTypes } from "../../typings/database"
import type { MongoServerError } from "mongodb"
import type { IUser } from "../../models/typings"
import { GetCachedConfig } from "../../helpers/Config"
import ConnectDatabase from "../../lib/ConnectDatabase"
import HandleAPIError from "../../helpers/HandleAPIError"
import ValidateSize from "../../helpers/ValidateSize"
import SendAPIError from "../../helpers/SendAPIError"
import ParseBody from "../../helpers/ParseBody"
import UserToken from "../../models/UserToken"
import typeis from "type-is"
import User from "../../models/User"

const maxSize = 1048576

interface IAddUser {
	username: string
	password: string
	access: AccessTypes
}

export default async function UserAPI(request: NextApiRequest, response: NextApiResponse){
	const contentType = request.headers["content-type"]
	const HandleError = HandleAPIError.bind(undefined, response)
	const SendError = SendAPIError.bind(undefined, response)
	const config = await GetCachedConfig(true)

	if(!ValidateSize(request.headers["content-length"], maxSize)) return HandleError("length")
	if(!contentType) return HandleError("contentType")
	if(!request.headers.origin) return HandleError("origin")
	if(!request.headers["user-agent"]) return HandleError("userAgent")

	try{
		await ConnectDatabase()

		switch(request.method){
			case "POST": {
				if(!typeis.is(contentType, "application/x-www-form-urlencoded")) return HandleError("contentType")

				const body = (await ParseBody(request)).toString()
				const data = Object.fromEntries(new URLSearchParams(body)) as unknown as IAddUser

				return await AddUser(data, config, request, response)
			}
			case "DELETE": {
				if(!typeis.is(contentType, "application/x-www-form-urlencoded")) return HandleError("contentType")

				const body = (await ParseBody(request)).toString()
				const { username } = Object.fromEntries(new URLSearchParams(body)) as { username?: string }

				return await DeleteUser(username, request, response)
			}
			case "PUT": {
				if(!typeis.is(contentType, "application/json")) return HandleError("contentType")

				const body = (await ParseBody(request)).toString()
				const data = JSON.parse(body) as IUpdateUser

				return await UpdateUser(data, config, request, response)
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
		if(!access || !(access = access.trim() as AccessTypes) || !accessTypes.includes(access)) throw "Tipo de acesso inválido"

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
			let error: string | undefined

			try{
				await UserToken.deleteMany({ name: username })
			}catch(error){
				console.error(error)
				error = "Falha ao deletar os tokens"
			}

			return response.status(200).json({ success: true, error })
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

export interface IUpdateUser {
	username: string
	data: {
		username?: string
		password?: string
		access?: AccessTypes
	}
}

async function UpdateUser({ username, data }: IUpdateUser, { accessTypes }: Config, request: NextApiRequest, response: NextApiResponse){
	const SendError = SendAPIError.bind(undefined, response)

	try{
		if(!username || !(username = username.trim())) throw "Usuário inválido"
		if(!data) throw "Não foram providas informações a serem atualizadas"
		if(typeof data.username === "string" && !data.username) throw "O novo usuário está inválido"
		if(typeof data.password === "string" && !data.password) throw "A nova senha está inválida"
		if(data.access && !accessTypes.includes(data.access = data.access.trim().toLowerCase() as AccessTypes)) throw "O novo acesso está inválido"

		const user = await User.findOne({ name: username })

		if(!user) return response.status(404).json({ success: false, error: "Usuário não encontrado" })

		const { username: name, password, access } = data
		const sameUser = await User.findOne({ name })

		if(sameUser) return response.status(409).json({ success: false, error: "Este nome de usuário já está em uso" })

		try{
			await user.updateOne({ $set: { name, password, access } })
			response.status(200).json({ success: true })
		}catch{
			response.status(500).json({ success: false, error: "Erro ao atualizar informações do usuário" })
		}
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
