import type { DocumentTypeInfo } from "@typings/database"

export interface INotificationData {
	hash: string
	folder: DocumentTypeInfo
	filename: string
	expiresAt: string
}

export interface APINotificationsResponse extends APIResponseSuccess {
	data: INotificationData[]
}
