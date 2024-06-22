"use client"

import type { APIFileObject, APIFilesFolderResponse } from "@api/files/typings"
import type { AccessTypes, Config, DocumentTypeInfo } from "@typings/database"
import type { APIResponseError } from "@typings/api"
import type { IUpdateDocument } from "@api/files/[hash]/typings"
import { useCallback, useEffect, useState } from "react"
import { MdOutlineModeEditOutline } from "react-icons/md"
import { toast, type ToastOptions } from "react-toastify"
import { useRouter } from "next/navigation"
import Overflow, { type OverflowData } from "./components/Overflow"
import GetFileName from "@helpers/GetFileName"
import useSWR from "swr"
import style from "../documents.module.scss"
import Link from "next/link"

function sortFiles(files: DocumentFolderPageClientProps["files"]){
	return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
}

export interface DocumentFolderPageClientProps {
	config: Config
	userAccess: AccessTypes
	folder: DocumentTypeInfo
	files: Omit<APIFileObject, "type" | "hashFilename">[]
}

export default function DocumentFolderPageClient({
	config,
	userAccess,
	folder: { name: title, reduced },
	...props
}: DocumentFolderPageClientProps){
	const router = useRouter()
	const [files, setFiles] = useState<typeof props["files"]>(() => sortFiles(props.files))
	const [toastConfig, setToastConfig] = useState<ToastOptions>({})
	const [clearErrors, setClearErrors] = useState(() => () => {})
	const [isOverflow, setIsOverflow] = useState(false)
	const [data, setData] = useState<OverflowData | undefined>()
	const hasAdminAccess = userAccess === "all"

	const { data: swrData, error: swrError } = useSWR(`/api/files?folder=${reduced || title}`, async url => {
		const response = await fetch(url, { cache: "reload" })
		const result = await response.json() as APIFilesFolderResponse | APIResponseError

		if(!result.success) throw new Error(result.error || "Algo deu errado")

		return result.data.files.map(({ hashFilename, ...data }) => data)
	}, {
		onErrorRetry(error, _key, _config, revalidate, { retryCount }){
			if(error.status === 404 || retryCount > 10) return
			setTimeout(() => revalidate({ retryCount }), 3e3)
		}
	})

	useEffect(() => {
		if(swrData) return setFiles(sortFiles(swrData))
		if(swrError) toast.error(swrError)
	}, [swrData, swrError])

	useEffect(() => setFiles(sortFiles(props.files)), [title])

	useEffect(() => setToastConfig(isOverflow ? { position: "bottom-right" } : {}), [isOverflow])

	const UpdateDocument = useCallback((hash: string, data?: IUpdateDocument) => {
		const file = files.find(file => file.hash === hash)

		if(!file) return

		// Remove document
		if(!data){
			if(files.length === 1){
				setFiles([])
				return router.push("/documents")
			}

			const index = files.indexOf(file)

			return setFiles([...files.slice(0, index), ...files.slice(index + 1)])
		}

		const { filename, access, createdDate, expireDate } = data

		if(filename) file.filename = filename
		if(access) file.access = access
		if(createdDate) file.createdAt = createdDate
		if(expireDate) file.expiresAt = expireDate

		setFiles(files.slice())
	}, [files])

	return <>
		<main className={style.list}>
			{/* TODO: Add button to redirect to /documents */}

			<header>
				<h1>{title}</h1>
				{reduced && <h2>({reduced})</h2>}
			</header>

			{files.length ? (
				<table>
					<thead>
						<tr>
							<td colSpan={hasAdminAccess ? 2 : undefined}>Nome</td>
							<td>Data de criação</td>
							<td>Data de expiração</td>
						</tr>
					</thead>
					<tbody>
						{files.map(({ hash, filename, createdAt, expiresAt, access }) => (
							<tr key={hash}>
								{hasAdminAccess && (
									<td className={style.edit}>
										<button
											title="Editar documento"
											aria-label={`Editar as informações do documento "${filename}"`}
											onClick={event => {
												event.currentTarget.blur()

												setData({
													name: GetFileName(filename),
													hash,
													access,
													filename,
													createdAt,
													expiresAt
												})

												clearErrors()
												setIsOverflow(true)
											}}
										>
											<MdOutlineModeEditOutline />
										</button>
									</td>
								)}
								<td className={style.filename}>
									<Link href={`/api/files/${hash}`} target="_blank" prefetch={false}>{filename}</Link>
								</td>
								<td>{new Date(createdAt).toLocaleDateString("pt-BR")}</td>
								<td>{new Date(expiresAt).toLocaleDateString("pt-BR")}</td>
							</tr>
						))}
					</tbody>
				</table>
			) : <p className={style.loading}>Carregando...</p>}
		</main>

		{data && (
			<Overflow {...{
				config,
				UpdateDocument,
				isOverflow,
				setIsOverflow,
				data,
				setData,
				toastConfig,
				setClearErrors
			}} />
		)}
	</>
}
