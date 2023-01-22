import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

const notifications = {
	unread: false
}

const locales = {
	siteLogo: "Logotipo do site",
	notifications: "Notificações",
	documents: "Documentos",
	logout: "Sair da conta",
	menu: "Menu"
}

function MobileMenu(){
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
			<span className="icon material-symbols-outlined" aria-label={locales.menu}>menu</span>

			<div className={contentHidden ? "content hidden" : "content"} aria-hidden={contentHidden}>
				<Link href="/documents" prefetch={false} aria-label={locales.documents}>
					<span className="icon material-symbols-outlined">description</span>
					{locales.documents}
				</Link>

				<Link href="/login" prefetch={false} aria-label={locales.logout}>
					<span className="icon material-symbols-outlined">logout</span>
					{locales.logout}
				</Link>
			</div>
		</div>
	)
}

export default function Navigation(){
	const [contentHidden, setContentHidden] = useState(true)

	return (
		<nav>
			<header>
				<Link href="/" prefetch={false}>
					<Image src="/images/logo.svg" alt={locales.siteLogo} loading="eager" width={32} height={32} />
					<span>Flash</span>
				</Link>
			</header>

			<div className="icons">
				<div id="notifications">
					<span className={"icon material-symbols-outlined".concat(notifications.unread ? " fill" : "")} onClick={event => {
						event.preventDefault()
						setContentHidden(!contentHidden)
					}} aria-label={locales.notifications}>
						{notifications.unread ? "notifications_active" : "notifications"}
					</span>

					<div className={"content".concat(contentHidden ? " hidden" : "")}>
						<p className="title">
							{locales.notifications}
						</p>
						<hr />
					</div>
				</div>

				<Link href="/documents" prefetch={false} aria-label={locales.documents}>
					<span className="icon material-symbols-outlined">description</span>
				</Link>

				<Link href="/login" prefetch={false} aria-label={locales.logout}>
					<span className="icon material-symbols-outlined">logout</span>
				</Link>
			</div>

			<MobileMenu />
		</nav>
	)
}
