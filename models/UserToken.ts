import type { IUserToken, UserTokenModel } from "./typings"
import { Schema, model, models } from "mongoose"

const UserTokenSchema = new Schema<IUserToken, UserTokenModel>({
	name: {
		type: String,
		required: true
	},
	token: {
		type: String,
		required: true,
		unique: true
	},
	access: {
		type: String,
		default: "public"
	},
	expires: {
		type: Date,
		required: true
	}
})

const UserToken: UserTokenModel = models.UserToken || model<IUserToken, UserTokenModel>("UserToken", UserTokenSchema)

export default UserToken
