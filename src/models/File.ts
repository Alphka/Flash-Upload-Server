import type { IFile, FileModel } from "./typings"
import { Schema, model, models } from "mongoose"

const FileSchema = new Schema<IFile, FileModel>({
	content: {
		type: Buffer,
		required: true
	},
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
	expiresAt: {
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

const File: FileModel = models.File || model<IFile, FileModel>("File", FileSchema)

export default File
