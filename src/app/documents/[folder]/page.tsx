import type { ResolvingMetadata } from "next"
import type { FilterQuery } from "mongoose"
import type { Revalidate } from "next/dist/server/lib/revalidate"
import type { IFile } from "@models/typings"
import { notFound, redirect } from "next/navigation"
import { GetCachedConfig } from "@helpers/Config"
import DocumentFolderPageClient from "./client"
import GetDocumentType from "@helpers/GetDocumentType"
import Authenticate from "@helpers/Authenticate"
import Navigation from "@components/Navigation"
import File from "@models/File"

interface DocumentFolderPageProps {
	params: {
		folder: string
	}
}

export async function generateStaticParams(){
	const { types } = await GetCachedConfig(true)
	return types.map(({ name }) => ({ folder: name }))
}

export async function generateMetadata({ params: { folder: folderName } }: DocumentFolderPageProps, parent: ResolvingMetadata){
	folderName = decodeURIComponent(folderName)

	const config = await GetCachedConfig(true)
	const folder = GetDocumentType(config, folderName)

	if(!folder) return await parent

	if(folder.reduced ? folderName !== folder.reduced.toLowerCase() : folderName !== folder.name.toLowerCase()){
		redirect(`/documents/${(folder.reduced || folder.name).toLowerCase()}`)
	}

	const title = folder.name || "Documentos"

	return {
		title,
		openGraph: {
			title
		}
	}
}

export default async function DocumentFolderPage({ params: { folder: folderName } }: DocumentFolderPageProps){
	const user = await Authenticate()
	const config = await GetCachedConfig(true)
	const folder = GetDocumentType(config, decodeURIComponent(folderName))

	if(!folder) notFound()

	const filesQuery: FilterQuery<IFile> = {
		type: folder.id
	}

	if(user.access !== "all") filesQuery.access = "public"

	const files = await File.find(filesQuery, {
		_id: 0,
		__v: 0,
		type: 0,
		content: 0,
		hashFilename: 0
	}).lean()

	if(!files.length) notFound()

	return <>
		<Navigation userAccess={user.access} />

		<DocumentFolderPageClient {...{
			config,
			folder,
			files: files.map(({ createdAt, uploadedAt, expiresAt, ...data }) => ({
				createdAt: new Date(createdAt).toISOString(),
				uploadedAt: new Date(uploadedAt).toISOString(),
				expiresAt: new Date(expiresAt || createdAt).toISOString(),
				...data
			})),
			userAccess: user.access
		}} />
	</>
}

export const revalidate: Revalidate = 0
