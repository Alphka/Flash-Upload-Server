import type { AccessTypes, IFileLean } from "../models/typings"
import type { GetServerSideProps } from "next"
import type { Config } from "../typings/database"
import { useEffect, useState } from "react"
import { GetCachedConfig } from "../helpers/Config"
import ConnectDatabase from "../lib/ConnectDatabase"
import GetTypeById from "../helpers/GetTypeById"
import Navigation from "../components/Navigation"
import UserToken from "../models/UserToken"
import useSWR from "swr"
import style from "../styles/modules/documents.module.scss"
import Head from "next/head"

const title = "Documentos"
const description = "Página de acesso para os documentos do Flash."

interface DocumentsProps {
	config: Config
	userToken: string
	userAccess: AccessTypes
}

export const getServerSideProps: GetServerSideProps<DocumentsProps> = async ({ req }) => {
	try{
		await ConnectDatabase()

		const { token } = req.cookies

		if(!token) return {
			redirect: {
				destination: "/",
				permanent: false
			}
		}

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

interface FolderData {
	name: string
	count: number
	privateCount: number
	userAccess: DocumentsProps["userAccess"]
}

function Folder({ name, count, privateCount, userAccess }: FolderData){
	const Message = (count: number, suffix: string) => `${count === 0 ? "Nenhum" : count} ${count < 2 ? "arquivo" : "arquivos"} ${suffix}`

	return (
		<div className={style.folder}>
			<div className={style.header}>
				<div className={style.title}>{name}</div>
			</div>
			<div className={style.content}>
				<div className={style.count}>{Message(count, "na pasta")}</div>
				{userAccess === "all" && <div className={style.access}>{Message(privateCount, "de acesso privado")}</div>}
			</div>
		</div>
	)
}

interface Folder {
	name: string
	count: number
	privateCount: number
}

interface FoldersProps {
	folders: Folder[]
	loading: boolean
	error: any
	userAccess: DocumentsProps["userAccess"]
}

function Folders({ folders, loading, error, userAccess }: FoldersProps){
	if(error) return <p>Algo deu errado</p>
	if(loading) return <p>Carregando...</p>
	if(!folders.length) return <p>Não há pastas</p>

	return (
		<div className={style.folders}>{folders.map(data => (
			<Folder key={data.name} {...{
				...data,
				userAccess
			}} />
		))}</div>
	)
}

export default function DocumentsPage({ config, userToken, userAccess }: DocumentsProps){
	const { data: files, error } = useSWR("/api/files", (url: string) => fetch(url, {
		headers: {
			Authorization: userToken
		}
	}).then(async response => {
		const { data } = await response.json()
		return data as IFileLean[]
	}))

	const foldersMap = new Map<string, { count: number, privateCount: number }>
	const folders = new Array<Folder>

	files?.forEach(file => {
		const type = GetTypeById(config, file.type)!
		const folder = type.name

		if(foldersMap.has(folder)){
			const object = foldersMap.get(folder)!

			if(file.access === "private"){
				object.privateCount++
			}

			object.count++
			foldersMap.set(folder, object)
		}else{
			const object = { count: 1, privateCount: file.access === "private" ? 1 : 0 } as const
			foldersMap.set(folder, object)
		}
	})

	for(const [name, data] of foldersMap.entries()){
		folders.push({ name, ...data })
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
			<Folders {...{ folders, loading: !files, error, userAccess }} />
		</main>
	</>
}
