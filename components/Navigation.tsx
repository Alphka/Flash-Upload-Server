import type { MouseEvent as ReactMouseEvent } from "react"
import type { INotificationData } from "../pages/api/notifications"
import type { AccessTypes } from "../typings/database"
import type { APIResponse } from "../typings/api"
import { memo, useRef, useState, useCallback } from "react"
import { useRouter } from "next/router"
import useSWR from "swr"
import Image from "next/image"
import Link from "next/link"

interface GlobalProps {
	userAccess: AccessTypes
	search?: string
}

interface NavigationProps extends GlobalProps {}
interface MobileProps extends GlobalProps {}
interface SearchFormProps extends GlobalProps { icon?: boolean }

const notifications = {
	unread: false
}

const locales = {
	siteLogo: "Logotipo do site",
	notifications: "Notificações",
	documents: "Documentos",
	settings: "Configurações",
	logout: "Sair da conta",
	menu: "Menu",
	search: "Pesquisar"
}

const iconClass = "icon material-symbols-outlined"
const fillIconClass = "icon fill material-symbols-outlined"

function MobileMenu({ userAccess }: MobileProps){
	const [searchBarCollapsed, setSearchBarCollapsed] = useState(true)
	const [contentHidden, setContentHidden] = useState(true)
	const refMenu = useRef<HTMLDivElement>(null)
	const refMenuIcon = useRef<HTMLSpanElement>(null)
	const refSearchBar = useRef<HTMLDivElement>(null)
	const refSearchIcon = useRef<HTMLSpanElement>(null)

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
		if(contentHidden && !searchBarCollapsed) setSearchBarCollapsed(true)
		return handleEventHide(setContentHidden, contentHidden, refMenuIcon)(event)
	}, [contentHidden, searchBarCollapsed])

	const handleSearchBarHide = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
		if(searchBarCollapsed && !contentHidden) setContentHidden(true)
		return handleEventHide(setSearchBarCollapsed, searchBarCollapsed, refSearchBar)(event)
	}, [contentHidden, searchBarCollapsed])

	return (
		<div className="icons mobile">
			<span className={iconClass} aria-label={locales.search} onClick={handleSearchBarHide} ref={refSearchIcon}>search</span>
			<span className={iconClass} aria-label={locales.menu} onClick={handleContentHide} ref={refMenuIcon}>menu</span>

			<div className={searchBarCollapsed ? "search collapsed" : "search"} aria-hidden={searchBarCollapsed} ref={refSearchBar}>
				<SearchForm {...{ userAccess }} />
			</div>

			<div className={contentHidden ? "content hidden" : "content"} aria-hidden={contentHidden} ref={refMenu}>
				<Link href="/documents" prefetch={false} aria-label={locales.documents}>
					<span className={iconClass}>description</span>
					{locales.documents}
				</Link>

				{userAccess === "all" && (
					<Link href="/settings" prefetch={false} aria-label={locales.settings}>
						<span className={iconClass}>settings</span>
						{locales.settings}
					</Link>
				)}

				<Link href="/login?logout" prefetch={false} aria-label={locales.logout}>
					<span className={iconClass}>logout</span>
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
				<Image src="/icons/logo.svg" alt={locales.siteLogo} loading="eager" width={32} height={32} draggable={false} />
				<span>Flash</span>
			</Link>
		</header>
	)
})

const Notifications = memo(function Notifications(){
	const { data, error } = useSWR("/api/notifications", async (url: string) => {
		const response = await fetch(url, { cache: "no-cache" })
		const json = await response.json() as APIResponse<INotificationData[]>

		if(!json.success) throw new Error(json.error || "Algo deu errado")

		return json.data
	})

	const [contentHidden, setContentHidden] = useState(true)
	const { unread } = notifications

	return (
		<div id="notifications">
			<span className={unread ? fillIconClass : iconClass} onClick={event => {
				event.preventDefault()
				setContentHidden(!contentHidden)
			}} aria-label={locales.notifications}>
				{unread ? "notifications_active" : "notifications"}
			</span>

			<div className={"content".concat(contentHidden ? " hidden" : "")}>
				<p className="title">
					{locales.notifications}
				</p>
				<hr />
				{error ? (
					<p className="error">Algo deu errado</p>
				) : data ? data.length ? (data.map(({ hash, folder, filename, expiresAt }) => {
					const url = `/documents/${folder.reduced?.toLowerCase() || folder.name.toLowerCase()}`
					const message = (() => {
						const today = new Date
						const expireDate = new Date(expiresAt)
						const expireUTC = Date.UTC(expireDate.getFullYear(), expireDate.getMonth(), expireDate.getDate())
						const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())

						let daysLeft = Math.floor((expireUTC - todayUTC) / 86400000) // 1000 * 60 * 60 * 24

						if(daysLeft === 0) return "Expira hoje"

						return `${daysLeft > 0 ? "Irá expirar" : (daysLeft = Math.abs(daysLeft), "Expirou")} em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`
					})()

					return (
						<div className="notification" key={hash}>
							<p className="title">
								<Link href={url} prefetch={false}>{filename}</Link>
							</p>
							<p className="content">{message}</p>
						</div>
					)
				})) : (
					<p>Não há notificações no momento</p>
				) : (
					<p>Carregando...</p>
				)}
			</div>
		</div>
	)
})

const SearchForm = memo<SearchFormProps>(function SearchForm({ icon, search }){
	const router = useRouter()

	return (
		<div id="search">
			<input type="search" placeholder="Faça uma pesquisa..." defaultValue={search} onKeyPress={event => {
				const input: HTMLInputElement = event.currentTarget

				if(event.key === "Enter"){
					event.preventDefault()

					const value = input.value.trim()

					if(!value) return

					router.push("/search?q=" + encodeURIComponent(value))
				}
			}} autoComplete="off" />
			{icon && <span className={iconClass}>search</span>}
		</div>
	)
})

const Navigation = memo(function Navigation({ userAccess, search }: NavigationProps){
	return (
		<nav>
			<Logo />

			<div className="icons">
				<SearchForm {...{
					userAccess,
					search,
					icon: true
				}} />

				<Notifications />

				<Link href="/documents" aria-label={locales.documents}>
					<span className={iconClass}>description</span>
				</Link>

				{userAccess === "all" && (
					<Link href="/settings" prefetch={false} aria-label={locales.settings}>
						<span className={iconClass}>settings</span>
					</Link>
				)}

				<Link href="/login?logout" prefetch={false} aria-label={locales.logout}>
					<span className={iconClass}>logout</span>
				</Link>
			</div>

			<MobileMenu {...{ userAccess }} />
		</nav>
	)
})

export default Navigation
