import type { GetServerSideProps } from "next"
import type { AccessTypes } from "../models/typings"
import type { FileInfo } from "../typings"
import type { Config } from "../typings/database"
import { useEffect, type RefObject } from "react"
import { useCallback, useState } from "react"
import { GetCachedConfig } from "../helpers/Config"
import { useRouter } from "next/router"
import { toast } from "react-toastify"
import ConnectDatabase from "../lib/ConnectDatabase"
import Unauthorize from "../helpers/Unauthorize"
import UserToken from "../models/UserToken"
import Head from "next/head"
import Image from "next/image"
import style from "../styles/modules/homepage.module.scss"
import Navigation from "../components/Navigation"
import UploadForm from "../components/UploadForm"
import UploadMenu from "../components/UploadMenu"

interface IndexProps {
	config: Config
	userAccess: AccessTypes
}

const title = "Página inicial"
const description = "Arquive seus documentos da Qualidade com facilidade e segurança!"

export const getServerSideProps: GetServerSideProps<IndexProps> = async ({ req, res }) => {
	try{
		await ConnectDatabase()

		const { token } = req.cookies

		if(token){
			const user = await UserToken.findOne({ token })

			if(user){
				const config = await GetCachedConfig(true)
				return { props: { config, userAccess: user.access } }
			}
		}

		return Unauthorize(res)
	}catch(error){
		console.error(error)
		return { notFound: true }
	}
}

export default function IndexPage({ config, userAccess }: IndexProps){
	const [isUploadMenu, setIsUploadMenu] = useState(false)
	const [files] = useState<FileInfo[]>([])
	const router = useRouter()

	let fileInputRef: RefObject<HTMLInputElement>

	const SetInputRef = useCallback((ref: typeof fileInputRef) => fileInputRef = ref, [])
	const AddFileInfos = useCallback((infos: FileInfo[]) => files.push(...infos), [])

	const ClearInput = useCallback(() => {
		const input = fileInputRef.current
		if(input?.files!.length) input.files = new DataTransfer().files
	}, [])

	useEffect(() => {
		if("denied" in router.query){
			toast.error("Você não tem permissão para acessar essa página")
			router.push("/", undefined, { shallow: true })
		}
	}, [])

	return <>
		<Head>
			<title>{`Flash - ${title}`}</title>
			<meta name="description" content={description} />
			<meta property="og:title" content={`Flash - ${title}`} />
			<meta property="og:description" content={description} />
		</Head>

		<Navigation {...{ userAccess }} />

		<main className={style.main}>
			<article className={style.content}>
				<section className={style.title}>Busque com rapidez e facilidade!</section>
				<section className={style.button}>
					<UploadForm {...{ setIsUploadMenu, AddFileInfos, SetInputRef, config }} />
				</section>
			</article>

			<aside className={style.image}>
				<Image src="/images/documents.png" alt="Ilustração de documentos" width={600} height={480} priority={true} quality={80} />
			</aside>
		</main>

		<UploadMenu {...{ inputFiles: files, isUploadMenu, setIsUploadMenu, ClearInput, types: config.types }} />
	</>
}
