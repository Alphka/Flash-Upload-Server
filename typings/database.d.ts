import type { FileAccess } from "../models/typings"

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
	accessTypes: AccessTypes[]
	accessFiles: FileAccess[]
}

export type AccessTypes = "all" | "public"

export interface Login {
	username: string
	password: string
	access: AccessTypes
}

export type LoginDatabase = Login[]
