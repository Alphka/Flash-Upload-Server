import type { MouseEvent, KeyboardEvent } from "react"
import type { NavigationProps } from ".."
import { memo, useRef, useState, useEffect, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { MdOutlineSearch } from "react-icons/md"

interface SearchFormProps extends NavigationProps { icon?: true, shouldFocus?: true }

const SearchForm = memo<SearchFormProps>(function SearchForm({ icon, search, shouldFocus }){
	const [autoFocus, setAutoFocus] = useState<boolean | undefined>(undefined)
	const inputRef = useRef<HTMLInputElement>(null)
	const searchParamsStore = useSearchParams()
	const pathname = usePathname()
	const router = useRouter()

	useEffect(() => {
		if(shouldFocus && pathname === "/search" && searchParamsStore?.get("q")?.trim() && inputRef.current){
			inputRef.current.focus()
			setAutoFocus(true)
		}
	}, [shouldFocus, pathname])

	const handleSubmit = useCallback((event: MouseEvent | KeyboardEvent) => {
		const input = inputRef.current

		if(!input) throw new Error("Search input not found")

		const search = input.value.trim()

		if(!search) return

		event.preventDefault()
		router.push("/search?q=" + encodeURIComponent(search), { scroll: false })
	}, [inputRef])

	const handleInputSubmit = useCallback((event: KeyboardEvent) => {
		if(event.key === "Enter") handleSubmit(event)
	}, [handleSubmit])

	return (
		<div id="search">
			<input
				type="search"
				placeholder="Faça uma pesquisa..."
				className="outline-none"
				defaultValue={search}
				onKeyPress={handleInputSubmit}
				autoComplete="off"
				autoFocus={autoFocus}
				ref={inputRef}
			/>

			{icon && <MdOutlineSearch className="icon" onClick={handleSubmit} />}
		</div>
	)
})

export default SearchForm
