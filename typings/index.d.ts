declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV?: "development" | "production"
			NODEMON?: "true"
		}
	}
}

export interface UploadInfo {
	file: {
		filename: string
		type: string
		content: Buffer
	}
	date: string
	documentType: string
}

export type Config = {
	port?: number
}

declare function CreateConfig(async: true): Promise<void>
declare function CreateConfig(async?: false): void
declare function SetConfig(data: Config, async: true): Promise<void>
declare function SetConfig(data: Config, async?: false): void
declare function GetConfig(async: true): Promise<Config>
declare function GetConfig(async?: false): Config

export { CreateConfig, SetConfig, GetConfig }
