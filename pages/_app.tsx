import type { AppContext, AppProps } from "next/app"
import { Poppins, Michroma } from "next/font/google"
import { ToastContainer } from "react-toastify"
import { matchesUA } from "browserslist-useragent"
import NextNProgress from "nextjs-progressbar"
import browserslist from "browserslist"
import Head from "next/head"
import App from "next/app"

import "../styles/global.scss"
import "../styles/nav.scss"
import "react-toastify/dist/ReactToastify.css"

const poppins = Poppins({
	weight: ["400", "500", "600"],
	subsets: ["latin"],
	display: "swap"
})

const michroma = Michroma({
	weight: "400",
	subsets: ["latin"],
	display: "swap"
})

type MyAppProps = Pick<AppProps, "Component" | "pageProps"> & {
	supportsSVG: boolean
}

const MyApp = ({ Component, pageProps, supportsSVG }: MyAppProps) => (
	<>
		<Head>
			<meta charSet="utf-8" />
			<meta name="author" content="Kayo Souza" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, shrink-to-fit=no" />
			<meta property="og:author" content="Kayo Souza" />
			<meta property="og:type" content="website" />
			<meta property="og:locale" content="pt_BR" />
			<meta property="og:site_name" content="Flash" />
			<meta property="og:image" content="/icons/apple-touch-icon.png" />
			<meta property="og:image:width" content="180" />
			<meta property="og:image:height" content="180" />
			<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
			{!supportsSVG && <>
				<link rel="icon" type="image/x-icon" sizes="32x32" href="/icons/favicon.ico" />
				<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="512x512" href="/icons/android-chrome-512x512.png" />
				<link rel="icon" type="image/png" sizes="192x192" href="/icons/android-chrome-192x192.png" />
			</>}
			<link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
			<link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#121d46" />
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
			<link rel="preload" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" as="style" />
		</Head>
		<style jsx global>{`
			:root{
				--font-family: ${poppins.style.fontFamily}, -apple-system, BlinkMacSystemFont, Segoe UI, Verdana, Arial, sans-serif;
				--logo-font-family: ${michroma.style.fontFamily}, Verdana, Segoe UI, Arial, sans-serif;
			}
		`}</style>
		<NextNProgress color="#ff3c5f" startPosition={0.1} stopDelayMs={100} height={3} options={{ showSpinner: false }} />
		<Component {...pageProps} />
		<ToastContainer autoClose={2000} theme="dark" pauseOnHover={false} pauseOnFocusLoss={false} />
	</>
)

MyApp.getInitialProps = async (context: AppContext) => {
	const ctx = await App.getInitialProps(context)
	const userAgent = context.ctx.req?.headers["user-agent"]

	let supportsSVG = false

	if(userAgent){
		const browsers = browserslist("Chrome >= 80, Edge >= 80, Firefox >= 41, Opera >= 67, ChromeAndroid >= 114, Samsung >= 13, OperaMobile >= 73, Baidu >= 13.18, KaiOS >= 2.5")
		supportsSVG = matchesUA(userAgent, { browsers })
	}

	return { ...ctx, supportsSVG }
}

export default MyApp
