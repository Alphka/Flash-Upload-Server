import type { AccessTypes } from "../User"
import type { Model } from "mongoose"

type DateType = Date | number | string

export type AccessTypes = "all" | "public"

export interface IFile {
	hash: string
	filename: string
	hashFilename: string
	createdAt: DateType
	uploadedAt: DateType
	expiresAt: DateType
	access?: AccessTypes
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
