import type { Config, Login, LoginAccess } from "../../typings/database.js"

export interface Accounts {
	all: Login[]
	byAccess: Record<LoginAccess, Login>
	byUsername: Record<string, Login>
}

export function CreateConfig(async: true): Promise<void>
export function CreateConfig(async?: false): void
export function SetConfig(data: Config, async: true): Promise<void>
export function SetConfig(data: Config, async?: false): void
export function GetConfig(async: true): Promise<Config>
export function GetConfig(async?: false): Config
export function CreateAccounts(async: true): Promise<void>
export function CreateAccounts(async?: false): void
export function GetAccounts(async: true): Promise<Accounts>
export function GetAccounts(async?: false): Accounts

export interface FilePart {
	folder?: string
	typeId?: string
	date?: string
	isFile?: boolean
}

export type { UploadFileError } from "../../typings/api.js"
