import type { Dispatch, SetStateAction } from "react"
import type internal from "stream"

declare global {
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
