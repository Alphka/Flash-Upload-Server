import type { Model } from "mongoose"
import { Schema, model, models } from "mongoose"

interface IFile {
	hash: string
	filename: string
	hashFilename: string
	createdAt: Date | number | string
	uploadedAt: Date | number | string
	access?: "public" | "all"
	type: number
}

type FileModel = Model<IFile>

const FileSchema = new Schema<IFile, FileModel>({
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

const File: FileModel = models.File || model<IFile, FileModel>("File", FileSchema)

export default File
