import { redirect } from "next/navigation"
import ConnectDatabase from "@lib/ConnectDatabase"
import GetAuthToken from "./GetAuthToken"
import UserToken from "@models/UserToken"

export default async function Authenticate(){
	await ConnectDatabase()

	const token = GetAuthToken()
	const user = token && await UserToken.findOne({ token })

	if(!token || !user) redirect("login")

	return user
}
