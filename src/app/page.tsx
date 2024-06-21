import type { Metadata, ResolvingMetadata } from "next"
import { GetCachedConfig } from "@helpers/Config"
import HomepageClient from "./client"
import Authenticate from "@helpers/Authenticate"
import Navigation from "@components/Navigation"

const title = "Página inicial"
const description = "Arquive seus documentos da Qualidade com facilidade e segurança!"

export async function generateMetadata(_pageProps: {}, parent: ResolvingMetadata){
	const { applicationName } = await parent

	return {
		title: `${title} - ${applicationName}`,
		description,
		openGraph: {
			title: `${title} - ${applicationName}`,
			description
		}
	} as Metadata
}

export default async function Homepage(){
	const user = await Authenticate()
	const config = await GetCachedConfig(true)

	return <>
		<Navigation userAccess={user.access} />

		<HomepageClient {...{
			config,
			userAccess: user.access
		}} />
	</>
}
