import type { IUser, UserModel, IUserMethods } from "./typings"
import { Schema, model, models } from "mongoose"

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

