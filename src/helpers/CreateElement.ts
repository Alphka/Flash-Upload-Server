export interface CreateElementOptions {
	[attribute: string]: any
	innerHTML?: string
	innerText?: string
	textContent?: string
	src?: string
	href?: string
	alt?: string
	title?: string
	name?: string
	type?: string
	value?: any
	class?: string
	className?: string
	id?: string
	children?: Element[]
}

function CreateElement<T extends keyof HTMLElementTagNameMap>(tagName: T, options?: CreateElementOptions): HTMLElementTagNameMap[T]

function CreateElement(tagName: string, options?: CreateElementOptions): HTMLElement

function CreateElement<T extends keyof HTMLElementTagNameMap>(options?: CreateElementOptions & {
	tagName?: T
}): HTMLElementTagNameMap[T]

function CreateElement(options?: CreateElementOptions & {
	tagName?: string
}): HTMLElement

function CreateElement(){
	let element: HTMLElement
	let options: CreateElementOptions

	switch(typeof arguments[0]){
		case "string":
			element = document.createElement(arguments[0])
			options = arguments[1] ?? {}
		break
		case "object":
			if(!arguments[0].tagName) throw new Error("tagName is not defined")

			element = document.createElement(arguments[0].tagName)
			options = arguments[0]

			delete options.tagName
		break
		default: throw new Error(`args cannot be a type of ${typeof arguments[0]}`)
	}

	if(options.children){
		options.children.forEach(child => element.appendChild(child))
		delete options.children
	}

	for(const [attribute, value] of Object.entries(options)){
		// @ts-ignore
		if(typeof value === "boolean" || attribute in element) element[attribute] = value, delete options[attribute]
		else element.setAttribute(attribute, value)
	}

	return element
}

export default CreateElement
