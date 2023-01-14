import { SearchToken } from "./Token.js"

const authRegex = /^Bearer \w{96}$/

/** @param {string | undefined} header */
function GetAuthToken(header){
	const match = header?.match(authRegex)
	return match?.[1] ?? null
}

/** @type {import("express").RequestHandler} */
export default async function Authenticate(request, response, next){
	const token = request.cookies.token

	if(token){
		const valid = await SearchToken(token)
		if(valid) return next()
	}

	next("auth")
}

/** @type {import("express").RequestHandler} */
export async function AuthenticateAPI(request, response, next){
	const token = request.cookies.token ?? GetAuthToken(request.header("authentication"))

	if(token){
		const valid = await SearchToken(token)
		if(valid) return next()
	}

	next("auth:api")
}
