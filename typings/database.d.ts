export interface DocumentTypeInfo {
	id: number
	name: string
	reduced?: string
}

export interface Config {
	isVercel?: true
	maxFileSize: number
	maxFiles: number
	maxSize: number
	types: DocumentTypeInfo[]
	accessTypes: LoginAccess[]
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
