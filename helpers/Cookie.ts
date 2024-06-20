export function GetCookies(){
	return Object.fromEntries(document.cookie.split("; ").map(cookie => {
		const [key, ...value] = cookie.split("=")
		return [key, value.join("=")]
	}))
}

interface GetCookieConfig {
	parse?: boolean
	decode?: boolean
}

export function GetCookie<T extends any = any>(key: string, config: GetCookieConfig = {}): T | undefined {
	const { parse, decode } = config

	for(const cookie of document.cookie.split("; ")){
		const [cookieKey, ...values] = cookie.split("=")

		if(key === cookieKey){
			const value = decode === false ? values.join("=") : decodeURIComponent(values.join("="))
			return parse ? JSON.parse(value) : value
		}
	}
}

type SetCookieValue = string | number | Boolean | Date

interface SetCookieConfig {
	domain?: string
	expires?: Date
	maxAge?: number | string
	path?: string
	secure?: Boolean
	sameSite?: "Strict" | "Lax" | "None"
}

export function SetCookie(key: string, value: SetCookieValue, config?: SetCookieConfig){
	if(value instanceof Date) value = value.toJSON()
	else value = String(value)

	config = Object.assign({ path: "/" }, config)

	let cookie = `${key}=${encodeURIComponent(value)}`

	if(config.path) cookie += "; Path=" + config.path
	if(config.domain) cookie += "; Domain=" + config.domain
	if(config.expires) cookie += "; Expires=" + config.expires.toUTCString()
	if(config.maxAge) cookie += "; Max-Age=" + config.maxAge
	if(config.sameSite) cookie += "; SameSite=" + config.sameSite
	if(config.secure) cookie += "; Secure"

	document.cookie = cookie
}
