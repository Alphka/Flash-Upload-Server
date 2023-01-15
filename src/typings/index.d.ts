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

export interface FileElements {
	container: HTMLElement
	name: HTMLParagraphElement
	nameLabel: HTMLSpanElement
	nameContent: HTMLSpanElement
	mime: HTMLParagraphElement
	mimeLabel: HTMLSpanElement
	mimeContent: HTMLSpanElement
	date: HTMLParagraphElement
	dateLabel: HTMLSpanElement
	dateInput: HTMLInputElement
	type: HTMLParagraphElement
	typeLabel: HTMLSpanElement
	typeSelect: HTMLSelectElement
	defaultOption: HTMLOptionElement
	checkbox: HTMLParagraphElement
	checkboxLabel: HTMLSpanElement
	checkboxInput: HTMLInputElement
}
