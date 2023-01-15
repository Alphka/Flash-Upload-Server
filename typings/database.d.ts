export interface DocumentTypeInfo {
	id: number
	name: string
	reduced?: string
}

export interface Config {
	port: number
	maxFileSize: number
	maxFiles: number
	types: DocumentTypeInfo[]
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
