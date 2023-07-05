import type { Dispatch, RefObject, SetStateAction } from "react"
import type { FileAccess } from "../models/typings"
import type internal from "stream"

export type Optional<T> = {
	[K in keyof T]?: T[K]
}

declare global {
	var mongoose: {
		connection: typeof import("mongoose") | null,
		promise: Promise<typeof import("mongoose")> | null
	}

	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV?: "development" | "production"
			PORT?: string
			MONGO_URL?: string
		}
	}

	interface File extends Blob {
		readonly lastModified: number;
		/** @deprecated */
		readonly lastModifiedDate: number;
		readonly name: string;
		readonly webkitRelativePath: string;
	}
}

export interface FileInfo {
	name: string
	type: string
	size: number
	date: number
	file: File
	show: boolean
}

interface FileReferences {
	container: RefObject<HTMLElement>
	nameInput: RefObject<HTMLInputElement>
	dateInput: RefObject<HTMLInputElement>
	typeSelect: RefObject<HTMLSelectElement>
	expireInput: RefObject<HTMLInputElement>
	checkboxInput: RefObject<HTMLInputElement>
}

export interface FileObject {
	info: FileInfo
	references: FileReferences
	setErrorMessage: Dispatch<SetStateAction<string | null>>
	getErrorMessage: () => string | null
}

export interface FilePart {
	id?: string
	folder?: FileAccess
	typeId?: string
	date?: string
	expire?: string
	isFile?: boolean
}

export type BusboyStream = internal.Readable & { truncated: boolean }
