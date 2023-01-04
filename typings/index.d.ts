declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV?: "development" | "production"
			NODEMON?: "true"
		}
	}
}

export type Config = {
	port?: number
}
