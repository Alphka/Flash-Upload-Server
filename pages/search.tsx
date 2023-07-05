import type { APIFilesFolderResponse, IFileData } from "./api/files"
import type { Config, AccessTypes } from "../typings/database"
import type { GetServerSideProps } from "next"
import type { APIResponseError } from "../typings/api"
import { useState, useEffect } from "react"
import { GetCachedConfig } from "../helpers/Config"
import { useRouter } from "next/router"
import GetDocumentType from "../helpers/GetDocumentType"
import ConnectDatabase from "../lib/ConnectDatabase"
import Navigation from "../components/Navigation"
import getBaseURL from "../helpers/getBaseURL"
import UserToken from "../models/UserToken"
import style from "../styles/modules/search.module.scss"
import Head from "next/head"
import Link from "next/link"

const title = "Pesquisa"

export const getServerSideProps: GetServerSideProps = async ({ req, query: { q: search } }) => {
	const { token } = req.cookies

	if(!token) return {
		redirect: {
			destination: "/",
			permanent: false
		}
	}

	if(typeof search !== "string") return { notFound: true }

	try{
		await ConnectDatabase()

		const config = await GetCachedConfig(true)
		const user = await UserToken.findOne({ token })

		if(!user) return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		}

		const url = new URL(`/api/search`, getBaseURL(req))

		url.searchParams.set("q", search)

		const response = await fetch(url, {
			headers: {
				Accept: "application/json",
				Authorization: token
			},
			credentials: "include"
		})

		const data = await response.json() as APIFilesFolderResponse | APIResponseError

		if(!data.success) return { notFound: true }

		const { data: files } = data

		return {
			props: {
				files,
				config,
				userToken: user.token,
				userAccess: user.access,
			}
		}
	}catch(error){
		console.error(error)
		return { notFound: true }
	}
}

interface SearchPageProps {
	userAccess: AccessTypes
	config: Config
	files: IFileData[]
}

export default function SearchPage({ config, userAccess, ...props }: SearchPageProps){
	const [files, setFiles] = useState(props.files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()))
	const router = useRouter()
	const search = router.query.q as string

	const description = search ? `${title} - ${search.length > 70 ? search.substring(0, 70 - 3) + ".".repeat(3) : search}` : title

	useEffect(() => {
		setFiles(props.files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()))
	}, [search])

	return <>
		<Head>
			<title>{`Flash - ${title}`}</title>
			<meta name="description" content={description} />
			<meta property="og:title" content={`Flash - ${title}`} />
			<meta property="og:description" content={description} />
		</Head>

		<Navigation {...{ userAccess, search }} />

		<main className={style.main}>
			<header>
				<h1 className={style.title}>Pesquisa</h1>
				<h2 className={style.search}>Resultados para: {search}</h2>
			</header>

			{files.length ? (
				<table>
					<thead>
						<tr>
							<td>Pasta</td>
							<td>Nome</td>
							<td>Data de criação</td>
							<td>Data de expiração</td>
						</tr>
					</thead>
					<tbody>
						{files.map(({ hash, filename, expiresAt, createdAt, type }) => {
							const { reduced, name } = GetDocumentType(config, type)!
							const folderName = reduced || name
							const folderUrl = `/documents/${folderName.toLowerCase()}`

							return (
								<tr key={hash}>
									<td className={`${style.no_underline} ${style.folder}`}><Link href={folderUrl}>{folderName}</Link></td>
									<td className={`${style.no_underline} ${style.filename}`}><Link href={`/api/files/${hash}`} target="_blank">{filename}</Link></td>
									<td>{new Date(createdAt).toLocaleDateString("pt-BR")}</td>
									<td>{new Date(expiresAt).toLocaleDateString("pt-BR")}</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			) : (
				<p className={style.error}>Não foram encotrados documentos com este termo</p>
			)}
		</main>
	</>
}
