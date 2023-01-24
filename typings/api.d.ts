export type APIResponse<T extends any = any> =
	| APIResponseSuccess<T>
	| APIResponseError

export type APIResponseSuccess<T extends any = any> = {
	success: true
	data?: T
	message?: string
}

export interface APIResponseError {
	success: false
	error?: string
}

export interface UploadFileError {
	message: string
	filename?: string
}

export type APIUploadResponse = {
	success: boolean
	message: string
	errors: UploadFileError[]
	uploaded: string[]
} | {
	success: false
	error: string
}

export type APILoginResponse = {
	success: true
} | APIResponseError
