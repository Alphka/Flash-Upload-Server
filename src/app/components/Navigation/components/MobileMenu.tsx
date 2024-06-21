import type { MouseEvent } from "react"
import type { NavigationProps } from ".."
import { MdOutlineDescription, MdSettings, MdOutlineLogout } from "react-icons/md"
import { memo, useRef, useState, useCallback } from "react"
import { twJoin, twMerge } from "tailwind-merge"
import Notifications from "./Notifications"
import SearchForm from "./SearchForm"
import Link from "next/link"

interface MobileProps extends NavigationProps {}

const MobileMenu = memo(function MobileMenu({ userAccess }: MobileProps){
	const [searchBarCollapsed, setSearchBarCollapsed] = useState(true)
	const [closeNotifications, setCloseNotifications] = useState(() => () => {})
	const [contentHidden, setContentHidden] = useState(true)
	const refMenu = useRef<HTMLDivElement>(null)
	const refMenuIcon = useRef<HTMLSpanElement>(null)
	const refSearchBar = useRef<HTMLDivElement>(null)
	const refSearchIcon = useRef<HTMLSpanElement>(null)
	const refNotificationsOpen = useRef<boolean | null>(null)

	const handleEventHide = (callback: typeof setSearchBarCollapsed | typeof setContentHidden, value: boolean, ref: typeof refMenuIcon | typeof refSearchBar) => {
		return (event: MouseEvent<HTMLDivElement>) => {
			event.nativeEvent.stopImmediatePropagation()
			event.preventDefault()

			function CloseHandler(event: globalThis.MouseEvent){
				if(ref.current && event.target instanceof HTMLElement){
					if(event.target === ref.current || ref.current.contains(event.target)) return
				}

				callback(true)
				event.preventDefault()
				window.removeEventListener("click", CloseHandler)
			}

			if(value){
				callback(false)
				window.addEventListener("click", CloseHandler)
			}else{
				callback(true)
				window.removeEventListener("click", CloseHandler)
			}
		}
	}

	const handleContentHide = useCallback((event: MouseEvent<HTMLDivElement>) => {
		if(contentHidden){
			if(!searchBarCollapsed) setSearchBarCollapsed(true)
			if(refNotificationsOpen) closeNotifications()
		}

		return handleEventHide(setContentHidden, contentHidden, refMenuIcon)(event)
	}, [contentHidden, searchBarCollapsed])

	const handleSearchBarHide = useCallback((event: MouseEvent<HTMLDivElement>) => {
		if(searchBarCollapsed){
			if(!contentHidden) setContentHidden(true)
			if(refNotificationsOpen) closeNotifications()
			refSearchBar.current!.querySelector("input")?.focus()
		}

		return handleEventHide(setSearchBarCollapsed, searchBarCollapsed, refSearchBar)(event)
	}, [contentHidden, searchBarCollapsed])

	const closeIcons = useCallback(() => {
		if(!contentHidden) setContentHidden(true)
		if(!searchBarCollapsed) setSearchBarCollapsed(true)
	}, [contentHidden, searchBarCollapsed])

	return (
		<div className="icons mobile">
			<span
				className="icon material-symbols-outlined notranslate"
				aria-label="Pesquisar"
				onClick={handleSearchBarHide}
				role="button"
				ref={refSearchIcon}
			>
				search
			</span>

			<Notifications {...{
				openRef: refNotificationsOpen,
				mobile: true,
				setCloseCallback: setCloseNotifications,
				closeIcons
			}} />

			<span
				className="icon material-symbols-outlined notranslate"
				aria-label="Menu"
				onClick={handleContentHide}
				role="button"
				ref={refMenuIcon}
			>
				menu
			</span>

			<div
				className={twJoin(
					"search",
					searchBarCollapsed && "collapsed"
				)}
				aria-hidden={searchBarCollapsed}
				ref={refSearchBar}
			>
				<SearchForm {...{ userAccess }} />
			</div>

			<div
				className={twMerge(
					"absolute flex flex-col gap-4 bg-dark shadow top-full right-1 mt-4 p-4 min-w-36 w-[60vw] max-w-sm z-[1]",
					contentHidden && "hidden"
				)}
				aria-hidden={contentHidden}
				ref={refMenu}
			>
				<Link className="flex items-center justify-start gap-4 no-underline select-none cursor-pointer" href="/documents" prefetch={false}>
					<MdOutlineDescription className="icon" />
					Documentos
				</Link>

				{userAccess === "all" && (
					<Link className="flex items-center justify-start gap-4 no-underline select-none cursor-pointer" href="/settings" prefetch={false}>
						<MdSettings className="icon" />
						Configurações
					</Link>
				)}

				<Link className="flex items-center justify-start gap-4 no-underline select-none cursor-pointer" href="/login?logout" prefetch={false}>
					<MdOutlineLogout className="icon" />
					Sair da conta
				</Link>
			</div>
		</div>
	)
})

export default MobileMenu
