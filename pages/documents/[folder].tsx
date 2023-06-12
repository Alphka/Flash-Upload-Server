import type { APIFilesFolderResponse } from "../api/files"
import type { GetServerSideProps } from "next"
import type { APIResponseError } from "../../typings/api"
import type { DocumentsProps } from "."
import { GetCachedConfig } from "../../helpers/Config"
import { useRouter } from "next/router"
import ConnectDatabase from "../../lib/ConnectDatabase"
import GetTypeById from "../../helpers/GetTypeById"
import Navigation from "../../components/Navigation"
import getBaseURL from "../../helpers/getBaseURL"
import UserToken from "../../models/UserToken"
import style from "../../styles/modules/documents.module.scss"
import Head from "next/head"
import Link from "next/link"

interface DocumentFolderProps extends DocumentsProps {
	type: APIFilesFolderResponse["data"]["type"]
	files: APIFilesFolderResponse["data"]["files"]
}

export const getServerSideProps: GetServerSideProps<DocumentFolderProps> = async ({ req, query: { folder } }) => {
	const { token } = req.cookies

	if(!token) return {
		redirect: {
			destination: "/",
			permanent: false
		}
	}

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

		const response = await fetch(new URL(`/api/files?folder=${folder}`, getBaseURL(req)), {
			headers: {
				Accept: "application/json",
				Authorization: token
			},
			credentials: "include"
		})

		const data = await response.json() as APIFilesFolderResponse | APIResponseError

		if(!data.success) return { notFound: true }

		const { data: { files, type } } = data

		return {
			props: {
				type,
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

export default function DocumentFolder({ config, type, files, userAccess }: DocumentFolderProps){
	const { query: { folder } } = useRouter()
	const title = GetTypeById(config, type)?.name || "Documentos"

	return <>
		<Head>
			<title>{`Flash - ${title}`}</title>
			<meta property="og:title" content={`Flash - ${title}`} />
		</Head>

		<Navigation {...{ userAccess }} />

		<p>Folder: {folder}</p>
		<p>Name: {title}</p>
		<p>Type: {type}</p>

		<br />

		<main className={style.list}>
			<table>
				<thead>
					<tr>
						<td>Nome</td>
						<td>Data de criação</td>
						<td>Data de envio</td>
						<td>Data de expiração</td>
					</tr>
				</thead>
				<tbody>
					{files.map(({ hash, filename, expiresAt, createdAt, uploadedAt, access }) => {
						const hasAccess = access !== "private" || userAccess === "all"

						return (
							<tr key={hash}>
								<td>{hasAccess ? <Link href={`/api/files/${hash}`} target="_blank">{filename}</Link> : filename}</td>
								<td>{new Date(createdAt).toLocaleDateString("pt-BR")}</td>
								<td>{new Date(uploadedAt).toLocaleDateString("pt-BR")}</td>
								<td>{new Date(expiresAt).toLocaleDateString("pt-BR")}</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</main>
	</>
}
