import type { ReactNode } from "react"
import type { Metadata, Viewport } from "next"
import { ToastContainer } from "react-toastify"
import { Poppins } from "next/font/google"

import "./styles/globals.scss"
import "./styles/nav.scss"
import "react-toastify/dist/ReactToastify.css"

const poppins = Poppins({
	weight: ["300", "400", "500", "600", "700"],
	subsets: ["latin", "latin-ext"],
	display: "swap"
})

interface LayoutProps {
	children: ReactNode
}

export const viewport: Viewport = {
	colorScheme: "dark",
	themeColor: "#101728",
	width: "device-width",
	initialScale: 1,
	maximumScale: 3
}

const title = "Flash"

global.baseURL = new URL("https://flash-upload-server.vercel.app")

export const metadata: Metadata = {
	metadataBase: global.baseURL,
	title: {
		default: title,
		template: "%s - " + title
	},
	applicationName: title,
	openGraph: {
		type: "website",
		title: {
			default: title,
			template: "%s - " + title
		}
	},
	appleWebApp: {
		capable: true,
		title
	},
	authors: {
		name: "Kayo Souza",
		url: "https://portfolio-alphka.vercel.app"
	},
	keywords: [
		"archive",
		"cloud",
		"documents",
		"quality",
		"management",
		"senai",
		"mongoose",
		"database"
	],
	generator: "Next.js"
}

export default function Layout({ children }: LayoutProps) {
	return (
		<html lang="pt-BR">
			<body className={poppins.className}>
				{children}
				<ToastContainer autoClose={2000} theme="dark" pauseOnHover={false} pauseOnFocusLoss={false} />
			</body>
		</html>
	)
}
