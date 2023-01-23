import type { AppProps } from "next/app"
import { ToastContainer } from "react-toastify"
import { Component } from "react"
import Head from "next/head"

import "../styles/global.scss"
import "../styles/nav.scss"
import "react-toastify/dist/ReactToastify.css"

const infoPages = {
	index: {
		title: "Página inicial",
		description: "Arquive seus documentos da Qualidade com facilidade e segurança!"
	},
	login: {
		title: "Login",
		description: "Entre para obter acesso aos documentos do Flash."
	},
	documents: {
		title: "Documentos",
		isLoggedIn: {
			description: "Página de acesso para os documentos do Flash."
		}
	}
} as const

export default class App extends Component<AppProps> {
	router!: AppProps["router"]

	RenderTitle(){
		let title: string = this.GetTitle()

		if(!title) return null

		title = "Flash - " + title

		return <>
			<title>{title}</title>
			<meta property="og:title" content={title} />
		</>
	}
	RenderDescription(){
		const description = this.GetDescription()

		return description ? <>
			<meta property="og:description" content={description} />
			<meta name="description" content={description} />
		</> : null
	}
	GetPageInfo(){
		const { pathname } = this.router
		return infoPages[pathname === "/" ? "index" : pathname.substring(1) as keyof typeof infoPages]
	}
	GetTitle(){
		return this.GetPageInfo()?.title
	}
	GetDescription(){
		// TODO: Check if logged in
		const info = this.GetPageInfo()
		if(info) return "description" in info ? info.description : infoPages.login.description
	}
	render(){
		const { Component, pageProps, router } = this.props

		this.router = router

		return <>
			<Head>
				<meta charSet="utf-8" />
				<meta name="author" content="Kayo Souza" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0" />
				{this.RenderTitle()}
				<meta property="og:type" content="website" />
				<meta property="og:locale" content="pt_BR" />
				<meta property="og:site_name" content="Flash" />
				{this.RenderDescription()}
				<link rel="shortcut icon" sizes="16x16" href="/images/favicon.ico" />
				<link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png" />
				<link rel="icon" type="image/png" sizes="512x512" href="/images/android-chrome-512x512.png" />
				<link rel="icon" type="image/png" sizes="192x192" href="/images/android-chrome-192x192.png" />
				<link rel="icon" type="image/svg+xml" sizes="any" href="/images/favicon.svg" />
				<link rel="mask-icon" href="/images/safari-pinned-tab.svg" color="#121d46" />
				<link rel="manifest" href="/site.webmanifest" />
				<meta name="application-name" content="Flash" />
				<meta name="apple-mobile-web-app-title" content="Flash" />
				<meta name="msapplication-TileColor" content="#101728" />
				<meta name="msapplication-config" content="/browserconfig.xml" />
				<meta name="theme-color" content="#101728" />
				<meta name="color-scheme" content="dark" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link rel="preload" href="https://fonts.googleapis.com/css2?family=Alata&family=Michroma&family=Poppins:wght@500;600;700&display=swap" as="style" />
				<link rel="preload" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" as="style" />
			</Head>
			<Component {...pageProps} />
			<ToastContainer autoClose={3000} theme="dark" pauseOnHover={false} pauseOnFocusLoss={false} />
		</>
	}
}
