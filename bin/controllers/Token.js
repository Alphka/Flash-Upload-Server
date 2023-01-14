import { createReadStream } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { randomBytes } from "crypto"
import { appendFile } from "fs/promises"
import { promisify } from "util"
import Crypto from "crypto"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const tokenOutput = join(__dirname, "../../database/tokens")

export async function CreateToken(){
	const buffer = await promisify(randomBytes)(48)
	return buffer.toString("hex")
}

/** @param {string} token */
export function EncryptToken(token){
	return Crypto.createHash("sha256").update(Buffer.from(token, "hex")).digest("hex")
}

/** @param {string} token */
export function SearchToken(token){
	const encrypted = EncryptToken(token)
	const stream = createReadStream(tokenOutput, "ascii")

	return new Promise((resolve, reject) => {
		let finished = false
		let old = ""

		stream.on("data", /** @param {string} chunk */ chunk => {
			const tokens = chunk.split("\n")
			const { length } = tokens

			const first = tokens[0]
			const last = tokens[length - 1]

			if(first.length !== 64) tokens[0] = old + first
			if(last.length !== 64) old = last, tokens.splice(length - 1, 1)

			if(tokens.includes(encrypted)){
				stream.close()
				resolve(true)
			}
		})

		stream.on("end", () => {
			console.log("end")
			if(!finished) resolve(false)
		})

		stream.on("error", reject)
	})
}

/** @param {string} token */
export function AddToken(token){
	return appendFile(tokenOutput, EncryptToken(token) + "\n", "utf8")
}
