"use client"

import type { Config, AccessTypes } from "@typings/database"
import type { Metadata } from "next"
import type { FileInfo } from "@typings"
import { memo, useEffect, type RefObject } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast, type ToastOptions } from "react-toastify"
import { useCallback, useState } from "react"
import { GetCookie, SetCookie } from "@helpers/Cookie"
import { Alata } from "next/font/google"
import UploadMenu from "./components/UploadMenu"
import UploadForm from "./components/UploadForm"
import style from "./homepage.module.scss"
import Image from "next/image"

const alata = Alata({
	weight: "400",
	subsets: ["latin"]
})

const title = "Página inicial"
const description = "Arquive seus documentos da Qualidade com facilidade e segurança!"

export const metadata: Metadata = {
	title,
	openGraph: {
		title,
		description
	}
}

interface HomepageClientProps {
	config: Config
	userAccess: AccessTypes
}

export default function HomepageClient({ config, userAccess }: HomepageClientProps){
	const searchParamsStore = useSearchParams()
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
				SetCookie("vercel-warn", "ok", {
					sameSite: "Strict",
					maxAge: 31536000
				})

				toast.warn("Esse site está sendo hosteado no Vercel. Isso significa que ele tem algumas limitações.", {
					pauseOnHover: true,
					autoClose: 5000
				})
			}
		}

		if(searchParamsStore?.has("denied")){
			toast.error("Você não tem permissão para acessar essa página")
			router.push("/", { scroll: false })
		}
	}, [])

	return <>
		<main className={style.main}>
			<article className={style.content}>
				<section className={`${style.title} ${alata.className}`}>
					Busque com rapidez e facilidade!
				</section>
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
				<Image
					src="/images/documents.png"
					alt="Ilustração de documentos"
					width={600}
					height={480}
					quality={90}
					draggable={false}
					priority
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
