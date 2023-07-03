import type { NextApiRequest } from "next"

export default function ParseBody(request: NextApiRequest){
	let chunks = Buffer.alloc(0)

	return new Promise<Buffer>((resolve, reject) => {
		request.on("data", (chunk: Buffer) => chunks = Buffer.concat([chunks, chunk]))
		request.on("end", () => resolve(chunks))
		request.on("error", reject)
	})
}
