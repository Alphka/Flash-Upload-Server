import type { AppProps } from "next/app"
import { ToastContainer } from "react-toastify"
import Head from "next/head"

import "../styles/global.scss"
import "../styles/nav.scss"
import "react-toastify/dist/ReactToastify.css"

export default function App({ Component, pageProps }: AppProps){
	return (
		<>
			<Head>
				<meta charSet="utf-8" />
				<meta name="author" content="Kayo Souza" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0" />
				<meta property="og:type" content="website" />
				<meta property="og:locale" content="pt_BR" />
				<meta property="og:site_name" content="Flash" />
				<meta property="og:image" content="/images/apple-touch-icon.png" />
				<meta property="og:image:width" content="180" />
				<meta property="og:image:height" content="180" />
				<link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png" />
				<link rel="icon" type="image/png" sizes="512x512" href="/images/android-chrome-512x512.png" />
				<link rel="icon" type="image/png" sizes="192x192" href="/images/android-chrome-192x192.png" />
				<link rel="icon" type="image/svg+xml" sizes="any" href="/images/favicon.svg" />
				<link rel="mask-icon" href="/images/safari-pinned-tab.svg" color="#121d46" />
				<link rel="manifest" href="/site.webmanifest" />
				<meta name="application-name" content="Flash" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-title" content="Flash" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="msapplication-TileColor" content="#101728" />
				<meta name="msapplication-config" content="/browserconfig.xml" />
				<meta name="theme-color" content="#101728" />
				<meta name="color-scheme" content="dark" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link rel="preload" href="https://fonts.googleapis.com/css2?family=Alata&family=Michroma&family=Poppins:wght@400;500;600;700&display=swap" as="style" />
				<link rel="preload" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" as="style" />
			</Head>
			<Component {...pageProps} />
			<ToastContainer autoClose={2000} theme="dark" pauseOnHover={false} pauseOnFocusLoss={false} />
		</>
	)
}
