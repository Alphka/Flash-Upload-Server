import type { AccessTypes } from "../models/typings"
import { memo, useState } from "react"
import Image from "next/image"
import Link from "next/link"

interface GlobalProps {
	userAccess: AccessTypes
}

interface NavigationProps extends GlobalProps {}
interface MobileProps extends GlobalProps {}

const notifications = {
	unread: false
}

const locales = {
	siteLogo: "Logotipo do site",
	notifications: "Notificações",
	documents: "Documentos",
	settings: "Configurações",
	logout: "Sair da conta",
	menu: "Menu"
}

const iconClass = "icon material-symbols-outlined"
const fillIconClass = "icon fill material-symbols-outlined"

function MobileMenu({ userAccess }: MobileProps){
	const [contentHidden, setContentHidden] = useState(true)

	return (
		<div className="icons mobile" onClick={event => {
			event.nativeEvent.stopImmediatePropagation()
			event.preventDefault()

			function CloseHandler(event: MouseEvent){
				event.preventDefault()
				setContentHidden(true)
				window.removeEventListener("click", CloseHandler)
			}

			if(contentHidden){
				setContentHidden(false)
				window.addEventListener("click", CloseHandler)
			}else{
				setContentHidden(true)
				window.removeEventListener("click", CloseHandler)
			}
		}}>
			<span className={iconClass} aria-label={locales.menu}>menu</span>

			<div className={contentHidden ? "content hidden" : "content"} aria-hidden={contentHidden}>
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

				<Link href="/login" prefetch={false} aria-label={locales.logout}>
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
				<Image src="/icons/logo.svg" alt={locales.siteLogo} loading="eager" width={32} height={32} />
				<span>Flash</span>
			</Link>
		</header>
	)
})

const Notifications = memo(function Notifications(){
	const [contentHidden, setContentHidden] = useState(true)
	const { unread } = notifications

	// TODO: Fix the notifications
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
			</div>
		</div>
	)
})

const Navigation = memo(function Navigation({ userAccess }: NavigationProps){
	return (
		<nav>
			<Logo />

			<div className="icons">
				<Notifications />

				<Link href="/documents" aria-label={locales.documents}>
					<span className={iconClass}>description</span>
				</Link>

				{userAccess === "all" && (
					<Link href="/settings" prefetch={false} aria-label={locales.settings}>
						<span className={iconClass}>settings</span>
					</Link>
				)}

				<Link href="/login" prefetch={false} aria-label={locales.logout}>
					<span className={iconClass}>logout</span>
				</Link>
			</div>

			<MobileMenu {...{ userAccess }} />
		</nav>
	)
})

export default Navigation
