import type { Dispatch, SetStateAction } from "react"
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
			API_URL?: string
			API_TOKEN?: string
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
}

interface FileReferences {
	container: RefObject<HTMLElement>
	dateInput: RefObject<HTMLInputElement>
	typeSelect: RefObject<HTMLSelectElement>
	checkboxInput: RefObject<HTMLInputElement>
}

export interface FileObject {
	info: FileInfo
	references: FileReferences
	setErrorMessage: Dispatch<SetStateAction<string | null>>
	getErrorMessage: () => string | null
}

export type FilesMap = Map<string, FileObject>

export interface FilePart {
	folder?: string
	typeId?: string
	date?: string
	isFile?: boolean
}

export type BusboyStream = internal.Readable & { truncated: boolean }
