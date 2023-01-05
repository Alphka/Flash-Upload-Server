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
}
