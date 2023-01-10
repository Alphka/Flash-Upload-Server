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

export interface Config {
	port?: number
}

export type LoginAccess =
	| "all"
	| "public"

export interface Login {
	username: string
	password: string
	access: LoginAccess
}

export type LoginDatabase = Login[]

export interface Accounts {
	all: Login[]
	byAccess: Record<LoginAccess, Login>
	byUsername: Record<string, Login>
}

declare function CreateConfig(async: true): Promise<void>
declare function CreateConfig(async?: false): void
declare function SetConfig(data: Config, async: true): Promise<void>
declare function SetConfig(data: Config, async?: false): void
declare function GetConfig(async: true): Promise<Config>
declare function GetConfig(async?: false): Config
declare function CreateAccounts(async: true): Promise<void>
declare function CreateAccounts(async?: false): void
declare function GetAccounts(async: true): Promise<Accounts>
declare function GetAccounts(async?: false): Accounts

export { CreateConfig, SetConfig, GetConfig, CreateAccounts, GetAccounts }
