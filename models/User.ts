import type { Model, Document, Types } from "mongoose"
import { Schema, model, models } from "mongoose"

export type AccessTypes = "all" | "public"

interface IUser {
	name: string
	password: string
	access: AccessTypes
}

interface IUserMethods {
	ValidatePassword(password: string): string
}

export type Users = (Document<unknown, any, IUser> & IUser & { _id: Types.ObjectId } & IUserMethods)[]

type UserModel = Model<IUser, {}, IUserMethods>

const UserSchema = new Schema<IUser, UserModel, IUserMethods>({
	name: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	access: {
		type: String,
		default: "public"
	}
})

UserSchema.method("ValidatePassword", function ValidatePassword(password: string){
	return this.password === password
})

const User: UserModel = models.User || model<IUser, UserModel>("User", UserSchema)

export default User

