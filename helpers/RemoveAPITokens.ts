import type { FilterQuery } from "mongoose"
import type { IUserToken } from "../models/typings"
import ConnectDatabase from "../lib/ConnectDatabase"
import UserToken from "../models/UserToken"

export default async function RemoveAPITokens(query: FilterQuery<IUserToken> = {}){
	try{
		await ConnectDatabase()
		await UserToken.deleteMany(query)
	}catch(error){
		console.error(error)
	}
}
