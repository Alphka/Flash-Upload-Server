"use client"

import type { APIFilesDocumentsResponse } from "@api/files/typings"
import type { APIResponseError } from "@typings/api"
import type { Config } from "@typings/database"
import { memo, useMemo } from "react"
import GetDocumentType from "@helpers/GetDocumentType"
import Folders from "./components/Folders"
import useSWR from "swr"
import style from "./documents.module.scss"

interface ContentProps {
	data: APIFilesDocumentsResponse["data"] | undefined
	error: boolean
	documentTypes: Config["types"]
}

const Content = memo(function Content({ error, data, documentTypes }: ContentProps){
	if(!error && !data) return (
		<p className={style.loading}>Carregando...</p>
	)

	if(error) return (
		<p className={style.error}>Algo deu errado</p>
	)

	if(!data) return (
		<p className={style.warning}>Não há documentos publicados</p>
	)

	const foldersMap = Object.fromEntries(Object.entries(data).map(([
		folderType,
		{ files, length }
	]) => {
		const documentType = GetDocumentType({ types: documentTypes }, folderType)!

		return [documentType.name, {
			files,
			count: length,
			reduced: documentType.reduced || documentType.name
		}]
	}))

	return (
		<Folders folders={foldersMap} />
	)
})

interface DocumentsPageClientProps {
	config: Pick<Config, "types">
}

export default function DocumentsPageClient({ config }: DocumentsPageClientProps){
	const documentTypes = useMemo(() => config.types, [])

	const { data, error } = useSWR("/api/files?documents", async url => {
		const response = await fetch(url, { cache: "no-cache" })
		const json = await response.json() as APIFilesDocumentsResponse | APIResponseError

		if(!json.success){
			if(json.error) throw new Error(json.error)
			return undefined
		}

		return json.data
	}, {
		onErrorRetry(error, _key, _config, revalidate, { retryCount }){
			if(error.status === 404 || retryCount > 10) return
			setTimeout(() => revalidate({ retryCount }), 3e3)
		}
	})

	return (
		<main className={style.main}>
			<header>
				<h1 className={style.title}>Documentos</h1>
			</header>

			<Content {...{ error, data, documentTypes }} />
		</main>
	)
}
