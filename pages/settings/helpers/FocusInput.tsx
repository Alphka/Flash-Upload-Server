import type { KeyboardEvent, RefObject } from "react"

export default function FocusInput<T extends HTMLElement, E extends HTMLElement>(input: RefObject<T>){
	return (event: KeyboardEvent<E>) => {
		if(event.key === "Enter") input.current!.focus()
	}
}
