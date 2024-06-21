import type { NextApiRequest } from "next"
import { NextRequest } from "next/server"

type RequestCookies = NextRequest["cookies"]

export default function GetAPIAuthToken(request: NextRequest | NextApiRequest){
	if(request.headers instanceof Headers){
		return request.headers.get("authorization")?.split("Bearer ").filter(Boolean)[0]
			|| (request.cookies as RequestCookies).get("token")?.value
			|| undefined
	}

	return request.headers.authorization?.split("Bearer ").filter(Boolean)[0]
		|| request.headers["cookie"]
		|| undefined
}
