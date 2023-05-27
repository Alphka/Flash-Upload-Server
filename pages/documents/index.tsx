import type { Config, LoginAccess } from "../../typings/database"
import type { GetServerSideProps } from "next"
import type { APIFileObject } from "../api/files"
import type { APIResponse } from "../../typings/api"
import { useCallback, useEffect, useRef, useState } from "react"
import { GetCachedConfig } from "../../helpers/Config"
import TruncateFilename from "../../helpers/TruncateFilename"
import ConnectDatabase from "../../lib/ConnectDatabase"
import GetTypeById from "../../helpers/GetTypeById"
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
	userAccess: LoginAccess
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

type FoldersMap = Map<string, Omit<Folder, "name"> & { files: APIFileObject[] }>

interface FoldersProps {
	folders: FoldersMap
	loading: boolean
	error: any
	userAccess: DocumentsProps["userAccess"]
}

interface Folder {
	name: string
	count: number
	reduced: string
	privateCount: number
}

function Folders({ folders, userAccess, loading, error }: FoldersProps){
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

	if(loading) return <div className={style.loading}>Carregando…</div>
	if(error) return <div className={style.error}>Algo deu errado</div>

	return (
		<div className={style.folders}>
			{Array.from(folders.entries()).map(([name, { files, count, privateCount, reduced }]) => {
				reduced = reduced.toLowerCase()

				return (
					<div className={style.folder} key={`folder-${reduced}`}>
						<div className={style.header}>
							<Link href={`/documents/${reduced}`}>
								<span className="icon material-symbols-outlined">folder</span>
								<span className={style.title}>{name}</span>
							</Link>
						</div>

						<div className={style.content}>
							<div className={style.header}>
								<span className={style.filename} ref={filenameRef}>Nome do arquivo</span>
								<span>Criação</span>
								<span>Envio</span>
								<span>Expiração</span>
							</div>

							{files.map(({ filename, createdAt, uploadedAt, expiresAt, hash, access }) => {
								const children = [
									<span>{new Date(createdAt).toLocaleDateString("pt-BR")}</span>,
									<span>{new Date(uploadedAt).toLocaleDateString("pt-BR")}</span>,
									<span>{new Date(expiresAt).toLocaleDateString("pt-BR")}</span>
								] as const

								if(access === "private" && userAccess !== "all"){
									return (
										<div className={`${style.file} ${style.private}`} key={hash}>
											<span className={style.filename}>{filename}</span>
											{children}
										</div>
									)
								}

								if(filename === "Arquivo privado") console.log(access, userAccess)

								return (
									<Link className={style.file} href={`/api/files/${hash}`} target="_blank" key={hash}>
										<span className={style.filename}>{TruncateFilename(filename, nameLength)}</span>
										{children}
									</Link>
								)
							})}
						</div>
					</div>
				)
			})}
		</div>
	)
}

export default function DocumentsPage({ config, userAccess }: DocumentsProps){
	const { data: files, error } = useSWR("/api/files", async (url: string) => {
		const response = await fetch(url, { cache: "no-cache" })
		const data = await response.json() as APIResponse<APIFileObject[]>

		if(!data.success) throw new Error(data.error || "Algo deu errado")

		const { data: files } = data

		return files!
	})

	const folders: FoldersMap = new Map

	files?.forEach(file => {
		const type = GetTypeById(config, file.type)!
		const { name: folder, reduced } = type

		if(folders.has(folder)){
			const object = folders.get(folder)!

			object.files.push(file)
			object.count++

			if(file.access === "private") object.privateCount++

			folders.set(folder, object)
		}else{
			const object = {
				files: [file],
				reduced: reduced || folder,
				count: 1,
				privateCount: file.access === "private" ? 1 : 0
			}

			folders.set(folder, object)
		}
	})

	return <>
		<Head>
			<title>{`Flash - ${title}`}</title>
			<meta name="description" content={description} />
			<meta property="og:title" content={`Flash - ${title}`} />
			<meta property="og:description" content={description} />
		</Head>

		<Navigation {...{ userAccess }} />

		<main className={style.main}>
			<Folders {...{ folders, loading: !files, error, userAccess }} />
		</main>
	</>
}
