import { cookies, headers } from "next/headers"

export default function GetAuthToken(){
	return headers().get("authorization")?.split("Bearer ").filter(Boolean)[0]
		|| cookies().get("token")?.value
		|| undefined
}
