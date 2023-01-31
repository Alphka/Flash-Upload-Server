import type { AccessTypes } from "./User"
import type { Model } from "mongoose"
import { Schema, model, models } from "mongoose"

interface IUserToken {
	token: string
	access: AccessTypes
	expires: Date | number | string
}

type UserTokenModel = Model<IUserToken>

const UserTokenSchema = new Schema<IUserToken, UserTokenModel>({
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
