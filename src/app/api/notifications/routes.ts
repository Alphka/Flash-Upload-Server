import { DocumentTypeInfo } from "@typings/database"
import { NextResponse } from "next/server"

export interface INotificationData {
	hash: string
	folder: DocumentTypeInfo
	filename: string
	expiresAt: string
}

export default function GET(){
	return NextResponse.next()
}
