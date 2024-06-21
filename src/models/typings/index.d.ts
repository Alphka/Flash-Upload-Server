import type { AccessTypes } from "@typings/database"
import type { Model } from "mongoose"

type DateType = Date | number | string

export type FileAccess = "private" | "public"

export interface IFile {
	content: Buffer
	hash: string
	filename: string
	hashFilename: string
	createdAt: DateType
	uploadedAt: DateType
	expiresAt: DateType
	access: FileAccess
	type: number
}

export interface IUser {
	name: string
	password: string
	access: AccessTypes
}

export interface IUserMethods {
	ValidatePassword(password: string): string
}

export interface IUserToken {
	name: string
	token: string
	access: AccessTypes
	expires: DateType
}

export type FileModel = Model<IFile>
export type UserModel = Model<IUser, {}, IUserMethods>
export type UserTokenModel = Model<IUserToken>
