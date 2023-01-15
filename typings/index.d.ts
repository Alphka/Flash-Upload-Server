import type internal from "stream"

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV?: "development" | "production"
			NODEMON?: "true"
		}
	}
}

export type BusboyStream = internal.Readable & { truncated: boolean }
