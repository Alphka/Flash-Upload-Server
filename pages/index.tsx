import type { Config, AccessTypes } from "../typings/database"
import type { GetServerSideProps } from "next"
import type { FileInfo } from "../typings"
import { memo, useEffect, useRef, type RefObject } from "react"
import { useCallback, useState } from "react"
import { GetCookie, SetCookie } from "../helpers/Cookie"
import { GetCachedConfig } from "../helpers/Config"
import { useRouter } from "next/router"
import { Alata } from "next/font/google"
import { toast, ToastOptions } from "react-toastify"
import ConnectDatabase from "../lib/ConnectDatabase"
import Unauthorize from "../helpers/Unauthorize"
import Navigation from "../components/Navigation"
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

interface UploadFormProps {
	config: Config
	toastConfig: ToastOptions
	setIsUploadMenu: (state: boolean) => any
	AddFileInfos: (infos: FileInfo[]) => any
	SetInputRef(ref: RefObject<HTMLInputElement>): any
}

const UploadForm = memo(function UploadForm({ config, setIsUploadMenu, toastConfig, AddFileInfos, SetInputRef }: UploadFormProps){
	const filesInputRef = useRef<HTMLInputElement>(null)

	SetInputRef(filesInputRef)

	return (
		<form action="/api/upload" method="post" name="upload" encType="multipart/form-data">
			<label tabIndex={0}
				onDragOver={event => event.preventDefault()}
				onDragEnter={event => event.preventDefault()}
				onDrop={event => {
					event.preventDefault()

					const files = event.dataTransfer?.files
					const filesInput = filesInputRef.current!

					if(!files?.length) return toast.error("Nenhum arquivo foi detectado", toastConfig)

					filesInput.files = files
					filesInput.dispatchEvent(new Event("change", { bubbles: true }))
				}}
				onKeyPress={event => {
					if(event.key === "Enter"){
						event.preventDefault()
						filesInputRef.current!.click()
					}
				}
			}>
				Enviar documento
				<input tabIndex={-1} type="file" name="file" multiple aria-hidden ref={filesInputRef} onChange={(event) => {
					const { files } = event.target

					if(!files?.length){
						setIsUploadMenu(false)
						toast.error("Nenhum arquivo foi selecionado", toastConfig)

						return
					}

					const { maxFiles, maxFileSize } = config

					if(files.length > maxFiles){
						setIsUploadMenu(false)
						toast.error(`O número máximo de arquivos permitidos é ${maxFiles}`, toastConfig)

						return
					}

					const filesArray = Array.from(files)

					if(filesArray.some(file => file.size > maxFileSize)){
						const sizeMB = maxFileSize / 1048576
						const sizeString = `${sizeMB % 1 === 0 ? sizeMB : sizeMB.toFixed(2)} MB`

						setIsUploadMenu(false)
						toast.error(`O tamanho máximo por arquivo é ${sizeString}`, toastConfig)

						return
					}

					try{
						setIsUploadMenu(true)

						AddFileInfos(filesArray.map(file => {
							const { name, type, size, lastModified: date } = file
							return { name, type, size, date, file, show: true } as FileInfo
						}))
					}catch(error){
						if(typeof error === "string") toast.error(error, toastConfig)
						console.error(error)
					}
				}} />
			</label>
		</form>
	)
})

export default function IndexPage({ config, userAccess }: IndexProps){
	const [isUploadMenu, setIsUploadMenu] = useState(false)
	const [toastConfig, setToastConfig] = useState<ToastOptions>({})
	const [files] = useState<FileInfo[]>([])
	const router = useRouter()

	useEffect(() => {
		setToastConfig(isUploadMenu ? { position: "bottom-right" } : {})
	}, [isUploadMenu])

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
					<UploadForm {...{
						setIsUploadMenu,
						AddFileInfos,
						SetInputRef,
						toastConfig,
						config
					}} />
				</section>
			</article>

			<aside className={style.image}>
				<Image src="/images/documents.png"
					alt="Ilustração de documentos"
					width={600}
					height={480}
					quality={90}
					priority={true}
					draggable={false}
					onLoad={event => {
						const image = event.currentTarget
						image.removeAttribute("width")
						image.removeAttribute("height")
					}}
				/>
			</aside>
		</main>

		<UploadMenu {...{
			userAccess,
			inputFiles: files,
			isUploadMenu,
			setIsUploadMenu,
			clearInput,
			toastConfig,
			types: config.types
		}} />
	</>
}
