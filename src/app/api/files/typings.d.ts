import type { APIResponseSuccess } from "@typings/api"

export interface FileData extends Omit<IFile, "content"> {}

export interface APIFileObject extends FileData {
	createdAt: string
	uploadedAt: string
	expiresAt: string
}

export interface APIFilesDocumentsResponse extends APIResponseSuccess {
	data: {
		[type: number]: {
			files: APIFileObject[]
			length: number
		}
	}
}

export interface APIFilesResponse extends APIResponseSuccess {
	data: APIFileObject[]
}

export interface APIFilesFolderResponse extends APIResponseSuccess {
	data: {
		type: number
		files: Omit<APIFileObject, "type">[]
	}
}
