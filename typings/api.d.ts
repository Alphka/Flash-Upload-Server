export type APIResponse<T extends any = any> = APIResponseSuccess<T> | APIResponseError
export type APIResponseMultiple<T extends any = any> = APIResponseSuccess<T> | APIResponseMultipleErrors

export type APIResponseSuccess<T extends any = any> = {
	success: true
	data?: T
	message?: string
}

export interface APIResponseError {
	success: false
	error?: string
}

export interface APIResponseMultipleErrors {
	success: false
	error?: string
}
