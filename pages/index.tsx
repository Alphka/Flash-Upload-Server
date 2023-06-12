import type { Config, AccessTypes } from "../typings/database"
import type { GetServerSideProps } from "next"
import type { FileInfo } from "../typings"
import { useEffect, type RefObject } from "react"
import { useCallback, useState } from "react"
import { GetCookie, SetCookie } from "../helpers/Cookie"
import { GetCachedConfig } from "../helpers/Config"
import { useRouter } from "next/router"
import { Alata } from "next/font/google"
import { toast } from "react-toastify"
import ConnectDatabase from "../lib/ConnectDatabase"
import Unauthorize from "../helpers/Unauthorize"
import Navigation from "../components/Navigation"
import UploadForm from "../components/UploadForm"
import UploadMenu from "../components/UploadMenu"
import UserToken from "../models/UserToken"
import Image from "next/image"
import style from "../styles/modules/homepage.module.scss"
import Head from "next/head"

const alata = Alata({
	weight: "400",
	subsets: ["latin"]
})

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

	const clearInput = useCallback(() => {
		const input = fileInputRef.current
		if(input?.files!.length) input.files = new DataTransfer().files
	}, [])

	useEffect(() => {
		if(config.isVercel){
			const vercelCookie = GetCookie("vercel-warn")

			if(!vercelCookie){
				SetCookie("vercel-warn", "ok", { sameSite: "Strict", maxAge: 31536000 })
				toast.warn("Esse site está sendo hosteado no Vercel. Isso significa que ele tem algumas limitações.")
			}
		}

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
				<section className={`${style.title} ${alata.className}`}>Busque com rapidez e facilidade!</section>
				<section className={style.button}>
					<UploadForm {...{ setIsUploadMenu, AddFileInfos, SetInputRef, config }} />
				</section>
			</article>

			<aside className={style.image}>
				<Image src="/images/documents.png" alt="Ilustração de documentos" width={600} height={480} priority={true} quality={80} draggable={false} />
			</aside>
		</main>

		<UploadMenu {...{
			userAccess,
			inputFiles: files,
			isUploadMenu,
			setIsUploadMenu,
			clearInput,
			types: config.types }} />
	</>
}
