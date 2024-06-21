"use client"

import type { AccessTypes } from "@typings/database"
import { MdOutlineDescription, MdSettings, MdOutlineLogout } from "react-icons/md"
import { Michroma } from "next/font/google"
import { memo } from "react"
import Notifications from "./components/Notifications"
import SearchForm from "./components/SearchForm"
import MobileMenu from "./components/MobileMenu"
import Image from "next/image"
import Link from "next/link"
import logo from "@app/icon.svg"

export interface NavigationProps {
	userAccess: AccessTypes
	search?: string
}

const michroma = Michroma({
	weight: "400",
	subsets: ["latin"],
	display: "swap"
})

function Logo(){
	return (
		<header>
			<Link href="/" prefetch={false}>
				<Image
					src={logo}
					alt="Logotipo do site"
					width={32}
					height={32}
					draggable={false}
					priority
				/>

				<span className={michroma.className}>Flash</span>
			</Link>
		</header>
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

				<Link href="/documents" aria-label="Documentos">
					<MdOutlineDescription className="icon" />
				</Link>

				{userAccess === "all" && (
					<Link href="/settings" aria-label="Configurações">
						<MdSettings className="icon" />
					</Link>
				)}

				<Link href="/login?logout" prefetch={false} aria-label="Sair da conta">
					<MdOutlineLogout className="icon" />
				</Link>
			</div>

			<MobileMenu {...{ userAccess }} />
		</nav>
	)
})

export default Navigation
