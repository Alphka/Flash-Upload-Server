import type { Model, InferSchemaType } from "mongoose"
import { Schema, model, models } from "mongoose"

const FileSchema = new Schema({
	hash: {
		type: String,
		required: true,
		unique: true,
		trim: true
	},
	filename: {
		type: String,
		required: true,
		trim: true
	},
	hashFilename: {
		type: String,
		required: true,
		trim: true
	},
	createdAt: {
		type: Date,
		required: true
	},
	uploadedAt: {
		type: Date,
		required: true
	},
	access: {
		type: String,
		trim: true,
		default: "public"
	},
	type: {
		type: Number,
		required: true,
		trim: true
	}
})

const File: Model<InferSchemaType<typeof FileSchema>> = models.File || model("File", FileSchema)

export default File
