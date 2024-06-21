import type { Revalidate } from "next/dist/server/lib/revalidate"
import type { Metadata } from "next"
import { GetCachedConfig } from "@helpers/Config"
import DocumentsPageClient from "./client"
import Authenticate from "@helpers/Authenticate"
import Navigation from "@components/Navigation"

const title = "Documentos"
const description = "Página de acesso para os documentos do Flash."

export const metadata: Metadata = {
	title,
	description,
	openGraph: {
		title,
		description
	}
}

export default async function DocumentsPage(){
	const user = await Authenticate()
	const config = await GetCachedConfig(true)

	return (
		<>
			<Navigation userAccess={user.access} />

			<DocumentsPageClient {...{ config }} />
		</>
	)
}

export const revalidate: Revalidate = 0
