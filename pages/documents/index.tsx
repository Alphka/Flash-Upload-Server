import type { APIFileObject, APIFilesDocumentsResponse } from "../api/files"
import type { Config, AccessTypes } from "../../typings/database"
import type { GetServerSideProps } from "next"
import type { APIResponseError } from "../../typings/api"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { GetCachedConfig } from "../../helpers/Config"
import GetDocumentType from "../../helpers/GetDocumentType"
import ConnectDatabase from "../../lib/ConnectDatabase"
import Navigation from "../../components/Navigation"
import UserToken from "../../models/UserToken"
import useSWR from "swr"
import style from "../../styles/modules/documents.module.scss"
import Head from "next/head"
import Link from "next/link"

const title = "Documentos"
const description = "Página de acesso para os documentos do Flash."

export interface DocumentsProps {
	config: Config
	userAccess: AccessTypes
}

export const getServerSideProps: GetServerSideProps<DocumentsProps> = async ({ req }) => {
	const { token } = req.cookies

	if(!token) return {
		redirect: {
			destination: "/",
			permanent: false
		}
	}

	try{
		await ConnectDatabase()

		const user = await UserToken.findOne({ token })

		if(!user) return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		}

		const config = await GetCachedConfig(true)

		return {
			props: {
				config,
				userToken: user.token,
				userAccess: user.access
			}
		}
	}catch(error){
		console.error(error)
		return { notFound: true }
	}
}

interface Folder {
	name: string
	count: number
	reduced: string
}

type FoldersMap = Map<string, Omit<Folder, "name"> & { files: APIFileObject[] }>

interface FoldersProps {
	folders: FoldersMap
	userAccess: DocumentsProps["userAccess"]
}

const Folders = memo<FoldersProps>(function Folders({ folders }){
	const [nameLength, setNameLength] = useState<number | undefined>(undefined)
	const filenameRef = useRef<HTMLSpanElement>(null)

	const updateLength = useCallback((element: HTMLSpanElement) => {
		const fontSize = Number(window.getComputedStyle(document.body).fontSize.match(/\d+/)![0])
		const length = Math.floor(element.clientWidth * 1.6 / fontSize)
		if(nameLength !== length) setNameLength(length)
	}, [nameLength])

	useEffect(() => {
		const element = filenameRef.current
		if(element) updateLength(element)
	})

	useEffect(() => {
		window.addEventListener("resize", () => {
			const element = filenameRef.current
			if(element) updateLength(element)
		})
	}, [])

	interface MoreDocumentsProps {
		href: string
		count: number
	}

	const MoreDocuments = memo(function MoreDocuments({ href, count }: MoreDocumentsProps){
		if(!count) return null

		const message = `mais ${count} ${count === 1 ? "arquivo" : "arquivos"}`

		return (
			<Link className={style.more} href={href} prefetch={false}>
				<span className="icon material-symbols-outlined">expand_more</span>
				<span>{message}</span>
			</Link>
		)
	})

	return (
		<div className={style.folders}>
			{Array.from(folders.entries()).map(([name, { files, reduced, count }]) => {
				reduced = reduced.toLowerCase()

				files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

				return (
					<div className={style.folder} key={`folder-${reduced}`}>
						<div className={style.header}>
							<Link href={`/documents/${reduced}`} prefetch={false}>
								<span className="icon material-symbols-outlined">folder</span>
								<span className={style.title}>{name}</span>
							</Link>
						</div>

						<div className={style.content}>
							{files.map(({ filename, hash }) => (
								<span key={hash} className={style.file}>{filename}</span>
							))}

							<MoreDocuments href={`/documents/${reduced}`} count={count - files.length} />
						</div>
					</div>
				)
			})}
		</div>
	)
})

export default function DocumentsPage({ config, userAccess }: DocumentsProps){
	const { data, error } = useSWR("/api/files?documents", async url => {
		const response = await fetch(url, { cache: "no-cache" })
		const json = await response.json() as APIFilesDocumentsResponse | APIResponseError

		if(!json.success){
			if(json.error) throw new Error(json.error)
			return {} as APIFilesDocumentsResponse["data"]
		}

		return json.data
	})

	const folders: FoldersMap = new Map

	if(data){
		for(const [type, { files, length }] of Object.entries(data)){
			const documentType = GetDocumentType(config, type)!
			const { name: folder, reduced } = documentType

			folders.set(folder, {
				files,
				count: length,
				reduced: reduced || folder
			})
		}
	}

	return <>
		<Head>
			<title>{`Flash - ${title}`}</title>
			<meta name="description" content={description} />
			<meta property="og:title" content={`Flash - ${title}`} />
			<meta property="og:description" content={description} />
		</Head>

		<Navigation {...{ userAccess }} />

		<main className={style.main}>
			<header>
				<h1 className={style.title}>Documentos</h1>
			</header>

			{error ? (
				<p className={style.error}>Algo deu errado</p>
			) : data ? Object.keys(data).length ? (
				<Folders {...{
					userAccess,
					folders
				}} />
			) : (
				<p className={style.warning}>Não há documentos publicados</p>
			) : (
				<p className={style.loading}>Carregando...</p>
			)}
		</main>
	</>
}
