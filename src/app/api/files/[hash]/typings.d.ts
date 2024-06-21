import type { FileAccess } from "@models/typings"

export interface IUpdateDocument {
	filename?: string
	createdDate?: string
	expireDate?: string
	access?: FileAccess
}
