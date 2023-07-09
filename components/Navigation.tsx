import type { MutableRefObject, MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent, Dispatch, SetStateAction } from "react"
import type { INotificationData } from "../pages/api/notifications"
import type { AccessTypes } from "../typings/database"
import type { APIResponse } from "../typings/api"
import { memo, useRef, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/router"
import LocalReadNotifications from "../helpers/LocalReadNotifications"
import useSWR from "swr"
import Image from "next/image"
import Link from "next/link"

interface GlobalProps {
	userAccess: AccessTypes
	search?: string
}

interface NavigationProps extends GlobalProps {}
interface MobileProps extends GlobalProps {}
interface SearchFormProps extends GlobalProps { icon?: true, shouldFocus?: true }

const locales = {
	siteLogo: "Logotipo do site",
	notifications: "Notificações",
	documents: "Documentos",
	settings: "Configurações",
	logout: "Sair da conta",
	menu: "Menu",
	search: "Pesquisar"
}

const SearchForm = memo<SearchFormProps>(function SearchForm({ icon, search, shouldFocus }){
	const [autoFocus, setAutoFocus] = useState<boolean | undefined>(undefined)
	const inputRef = useRef<HTMLInputElement>(null)
	const router = useRouter()

	useEffect(() => {
		if(shouldFocus && router.asPath === "/search" && router.query.q){
			if(inputRef.current){
				inputRef.current.focus()
				setAutoFocus(true)
			}
		}
	}, [router.asPath])

	const handleSubmit = useCallback((event: ReactMouseEvent | ReactKeyboardEvent) => {
		const input = inputRef.current

		if(!input) throw new Error("Search input not found")

		const search = input.value.trim()

		if(search){
			event.preventDefault()
			router.push("/search?q=" + encodeURIComponent(search), "/search")
		}
	}, [inputRef])

	const handleInputSubmit = useCallback((event: ReactKeyboardEvent) => {
		if(event.key === "Enter") handleSubmit(event)
	}, [handleSubmit])

	return (
		<div id="search">
			<input type="search"
				placeholder="Faça uma pesquisa..."
				className="no-outline"
				defaultValue={search}
				onKeyPress={handleInputSubmit}
				autoComplete="off"
				autoFocus={autoFocus}
				ref={inputRef}
			/>
			{icon && <span className="icon material-symbols-outlined" onClick={handleSubmit}>search</span>}
		</div>
	)
})

function MobileMenu({ userAccess }: MobileProps){
	const [searchBarCollapsed, setSearchBarCollapsed] = useState(true)
	const [closeNotifications, setCloseNotifications] = useState(() => () => {})
	const [contentHidden, setContentHidden] = useState(true)
	const refMenu = useRef<HTMLDivElement>(null)
	const refMenuIcon = useRef<HTMLSpanElement>(null)
	const refSearchBar = useRef<HTMLDivElement>(null)
	const refSearchIcon = useRef<HTMLSpanElement>(null)
	const refNotificationsOpen = useRef<boolean | null>(null)

	const handleEventHide = (callback: typeof setSearchBarCollapsed | typeof setContentHidden, value: boolean, ref: typeof refMenuIcon | typeof refSearchBar) => {
		return (event: ReactMouseEvent<HTMLDivElement>) => {
			event.nativeEvent.stopImmediatePropagation()
			event.preventDefault()

			function CloseHandler(event: MouseEvent){
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

	const handleContentHide = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
		if(contentHidden){
			if(!searchBarCollapsed) setSearchBarCollapsed(true)
			if(refNotificationsOpen) closeNotifications()
		}

		return handleEventHide(setContentHidden, contentHidden, refMenuIcon)(event)
	}, [contentHidden, searchBarCollapsed])

	const handleSearchBarHide = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
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
			<span className="icon material-symbols-outlined" aria-label={locales.search} onClick={handleSearchBarHide} ref={refSearchIcon}>search</span>
			<Notifications {...{ openRef: refNotificationsOpen, mobile: true, setCloseCallback: setCloseNotifications, closeIcons }} />
			<span className="icon material-symbols-outlined" aria-label={locales.menu} onClick={handleContentHide} ref={refMenuIcon}>menu</span>

			<div className={searchBarCollapsed ? "search collapsed" : "search"} aria-hidden={searchBarCollapsed} ref={refSearchBar}>
				<SearchForm {...{ userAccess }} />
			</div>

			<div className={contentHidden ? "content hidden" : "content"} aria-hidden={contentHidden} ref={refMenu}>
				<Link href="/documents" prefetch={false} aria-label={locales.documents}>
					<span className="icon material-symbols-outlined">description</span>
					{locales.documents}
				</Link>

				{userAccess === "all" && (
					<Link href="/settings" prefetch={false} aria-label={locales.settings}>
						<span className="icon material-symbols-outlined">settings</span>
						{locales.settings}
					</Link>
				)}

				<Link href="/login?logout" prefetch={false} aria-label={locales.logout}>
					<span className="icon material-symbols-outlined">logout</span>
					{locales.logout}
				</Link>
			</div>
		</div>
	)
}

const Logo = memo(function Logo(){
	return (
		<header>
			<Link href="/" prefetch={false}>
				<Image src="/icons/logo.svg" alt={locales.siteLogo} loading="eager" width={32} height={32} draggable={false} priority={true} />
				<span>Flash</span>
			</Link>
		</header>
	)
})

function DateUTC(isoDate: string){
	const [year, month, day] = isoDate.substring(0, 10).split("-").map(Number) as [number, number, number]
	return Date.UTC(year, month - 1, day)
}

type INotificationProps = Pick<INotificationData, "folder" | "filename" | "expiresAt">

const Notification = memo<INotificationProps>(function Notification({ folder, filename, expiresAt }){
	const url = `/documents/${folder.reduced?.toLowerCase() || folder.name.toLowerCase()}`
	const message = (() => {
		const todayUTC = DateUTC(new Date().toISOString())
		const expireUTC = DateUTC(expiresAt)

		let daysLeft = Math.floor((expireUTC - todayUTC) / 86400000) // 1000 * 60 * 60 * 24

		if(daysLeft === 0) return "Expira hoje"

		return `${daysLeft > 0 ? "Irá expirar em" : (daysLeft = Math.abs(daysLeft), "Expirou há")} ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`
	})()

	return (
		<div className="notification">
			<p className="title">
				<Link href={url} prefetch={false}>{filename}</Link>
			</p>
			<p className="content">{message}</p>
		</div>
	)
})

interface NotificationsProps {
	mobile?: boolean
	openRef?: MutableRefObject<boolean | null>
	closeIcons?: () => void
	setCloseCallback?: Dispatch<SetStateAction<() => void>>
}

function Notifications({ mobile, openRef, closeIcons, setCloseCallback }: NotificationsProps){
	const { data, error } = useSWR("/api/notifications", async (url: string) => {
		const response = await fetch(url, { cache: "no-cache" })
		const json = await response.json() as APIResponse<INotificationData[]>

		if(!json.success) throw new Error(json.error || "Algo deu errado")

		return json.data
	})

	const [notificationsUnread, setNotificationsUnread] = useState(false)
	const [contentHidden, setContentHidden] = useState(true)
	const refMenu = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if(setCloseCallback) setCloseCallback(() => () => setContentHidden(true))
	}, [setCloseCallback])

	const markAsRead = useCallback(() => {
		if(data?.length){
			const hashes = data.map(({ hash }) => hash)
			LocalReadNotifications.AddHashes(hashes)
		}else{
			LocalReadNotifications.SetHashes([])
		}

		setNotificationsUnread(false)
	}, [data, contentHidden])

	useEffect(() => {
		let unread = false

		if(data?.length){
			const localHashes = LocalReadNotifications.GetHashes()

			if(localHashes.length){
				const hashes = data.map(({ hash }) => hash)

				for(const hash of hashes){
					if(!localHashes.includes(hash)){
						unread = true
						break
					}
				}

				// Remove old hashes from local storage
				let outdatedHashes: string[] = []

				for(const hash of localHashes){
					if(!hashes.includes(hash)) outdatedHashes.push(hash)
				}

				if(outdatedHashes.length){
					LocalReadNotifications.SetHashes(localHashes.filter(hash => !outdatedHashes.includes(hash)))
				}
			}else unread = true

		}else unread = false

		setNotificationsUnread(unread)
	}, [data])

	const Content = useCallback(function Content(){
		if(error) return <p className="error">Algo deu errado</p>

		if(data){
			if(data.length){
				// TODO: Get this from config
				const limit = 5
				const shouldLimit = data.length > limit
				const notifications = data
					.map(({ expiresAt, ...data }) => ({
						expiresAt: new Date(expiresAt).getTime(),
						expiresAtString: expiresAt,
						...data
					}))
					.sort((a, b) => b.expiresAt - a.expiresAt)
					.slice(0, limit)
					.map(({ hash, expiresAtString, ...data }) => (
						<Notification key={hash} {...{
							...data,
							expiresAt: expiresAtString
						}} />
					))

				if(shouldLimit){
					const limited = data.length - limit
					const message = `${limited} ${limited === 1 ? " notificação foi oculta" : "notificações foram ocultas"}`

					return <>
						{notifications}
						<p className="more">{message}</p>
					</>
				}

				return <>{notifications}</>
			}

			return <p>Não há notificações no momento</p>
		}

		return <p>Carregando...</p>
	}, [data, error])

	return (
		<div className={mobile ? "notifications mobile" : "notifications"} ref={refMenu}>
			<span className={notificationsUnread ? "icon material-symbols-outlined fill" : "icon material-symbols-outlined"} onClick={event => {
				event.nativeEvent.stopImmediatePropagation()
				event.preventDefault()

				function CloseHandler(event: MouseEvent){
					if(refMenu.current && event.target instanceof HTMLElement){
						if(event.target === refMenu.current || refMenu.current.contains(event.target)) return
					}

					setContentHidden(true)
					event.preventDefault()
					window.removeEventListener("click", CloseHandler)
				}

				if(openRef) openRef.current = contentHidden

				if(contentHidden){
					markAsRead()
					closeIcons?.()
					setContentHidden(false)
					window.addEventListener("click", CloseHandler)
				}else{
					setContentHidden(true)
					window.removeEventListener("click", CloseHandler)
				}
			}} aria-label={locales.notifications}>
				{notificationsUnread ? "notifications_active" : "notifications"}
			</span>

			<div className={contentHidden ? "content hidden" : "content"} aria-hidden={contentHidden}>
				<p className="title">
					{locales.notifications}
				</p>
				<hr />
				<Content />
			</div>
		</div>
	)
}

const Navigation = memo<NavigationProps>(function Navigation({ userAccess, search }){
	return (
		<nav>
			<Logo />

			<div className="icons">
				<SearchForm {...{
					userAccess,
					search,
					icon: true,
					shouldFocus: true
				}} />

				<Notifications />

				<Link href="/documents" aria-label={locales.documents}>
					<span className="icon material-symbols-outlined">description</span>
				</Link>

				{userAccess === "all" && (
					<Link href="/settings" prefetch={false} aria-label={locales.settings}>
						<span className="icon material-symbols-outlined">settings</span>
					</Link>
				)}

				<Link href="/login?logout" prefetch={false} aria-label={locales.logout}>
					<span className="icon material-symbols-outlined">logout</span>
				</Link>
			</div>

			<MobileMenu {...{ userAccess }} />
		</nav>
	)
})

export default Navigation
