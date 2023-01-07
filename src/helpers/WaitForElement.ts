type HTMLElementInstances = HTMLElementTagNameMap[keyof HTMLElementTagNameMap]

type WaitElementOptions = {
	/** @default false */
	multiple?: boolean
	/**
	 * Where to search
	 * @default window.document
	 */
	element?: HTMLElementInstances
	/** How long the loop will last */
	expires?: number
	/** @default true */
	noError?: boolean
}

interface WaitForElementRaceValue {
	interval: number,
	element: HTMLElement
}

function WaitForElement<T extends keyof HTMLElementTagNameMap>(selector: T[]): Promise<HTMLElementTagNameMap[T]>
function WaitForElement<T extends HTMLElementInstances>(selector: string[]): Promise<T>

function WaitForElement<T extends keyof HTMLElementTagNameMap>(
	selector: T,
	options?: WaitElementOptions & {
		multiple?: false
		expires?: number
		noError?: false
	}): Promise<HTMLElementTagNameMap[T]>

function WaitForElement<T extends keyof HTMLElementTagNameMap>(
	selector: T,
	options?: WaitElementOptions & {
		multiple: true
		expires?: number
		noError?: false
	}): Promise<NodeListOf<HTMLElementTagNameMap[T]>>

function WaitForElement<T extends HTMLElementInstances>(
	selector: string,
	options?: WaitElementOptions & {
		multiple?: false
		expires?: number
		noError?: false
	}): Promise<T>

function WaitForElement<T extends HTMLElementInstances>(
	selector: string,
	options?: WaitElementOptions & {
		multiple: true
		expires?: number
		noError?: false
	}): Promise<NodeListOf<T>>

function WaitForElement<T extends keyof HTMLElementTagNameMap>(
	selector: T,
	options?: WaitElementOptions & {
		multiple?: false
		expires: number
		noError: true
	}): Promise<HTMLElementTagNameMap[T] & {
		isError: boolean
	}>

function WaitForElement<T extends keyof HTMLElementTagNameMap>(
	selector: T,
	options?: WaitElementOptions & {
		multiple: true
		expires: number
		noError: true
	}): Promise<NodeListOf<HTMLElementTagNameMap[T]> & {
		isError: boolean
	}>

function WaitForElement<T extends HTMLElementInstances>(
	selector: string,
	options?: WaitElementOptions & {
		multiple?: false
		expires: number
		noError: true
	}): Promise<T & {
		isError: boolean
	}>

function WaitForElement<T extends HTMLElementInstances>(
	selector: string,
	options?: WaitElementOptions & {
		multiple: true
		expires: number
		noError: true
	}): Promise<NodeListOf<T> & {
		isError: boolean
	}>

function WaitForElement(selector: string | string[], options?: WaitElementOptions){
	const element = options?.element ?? window.document
	const begin = Date.now()

	if(selector instanceof Array){
		const promises = new Map<number, {
			promise: Promise<WaitForElementRaceValue>
			resolve: (value: any) => void
		}>()

		selector.forEach(e => {
			let _resolve: (value: any) => void
			let _interval: number

			const promise = new Promise<WaitForElementRaceValue>(resolve => {
				const interval = window.setInterval(() => element.querySelector(e) && (
					clearInterval(interval),
					resolve({
						interval,
						element: element.querySelector(e)!
					})
				))

				_resolve = resolve
				_interval = interval
			})

			promises.set(_interval!, {
				promise,
				resolve: _resolve!
			})
		})

		return Promise.race(Array.from(promises.values()).map(e => e.promise)).then(value => {
			promises.delete(value.interval)

			Array.from(promises.entries()).forEach(([interval, data]) => {
				clearInterval(interval)
				data.resolve(value.element)
				promises.delete(interval)
			})

			return value.element
		})
	}

	return new Promise((resolve, reject) => {
		const interval = window.setInterval(() => {
			const elements = element.querySelectorAll(selector)

			if(elements.length){
				const returnValue = options?.multiple ? elements : elements[0]

				clearInterval(interval)
				resolve(options?.noError ? Object.assign(returnValue, { isError: false }) : returnValue)

				return
			}

			if(options?.expires && Date.now() >= options.expires + begin) {
				clearInterval(interval)
				options.noError ? resolve({ isError: true }) : reject("Selector not found: " + selector)
			}
		})
	})
}

export default WaitForElement
