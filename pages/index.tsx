import type { GetServerSideProps, InferGetServerSidePropsType } from "next"
import type { RefObject } from "react"
import type { FileInfo } from "../typings"
import { memo, useCallback, useState } from "react"
import { GetCachedConfig } from "../helpers/Config"
import ConnectDatabase from "../lib/ConnectDatabase"
import UserToken from "../models/UserToken"
import Image from "next/image"
import style from "../styles/modules/index.module.scss"
import Navigation from "../components/Navigation"
import UploadForm from "../components/UploadForm"
import UploadMenu from "../components/UploadMenu"

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
	try{
		await ConnectDatabase()

		const { token } = req.cookies

		if(token){
			const user = await UserToken.findOne({ token })

			if(user){
				const config = await GetCachedConfig(true)
				return { props: { config } }
			}
		}

		return {
			redirect: {
				statusCode: 302,
				destination: "/login"
			}
		}
	}catch(error){
		return { notFound: true, error }
	}
}

const IndexPage = memo(function Index({ config }: InferGetServerSidePropsType<typeof getServerSideProps>){
	const [isUploadMenu, setIsUploadMenu] = useState(false)
	const [files] = useState<FileInfo[]>([])

	let fileInputRef: RefObject<HTMLInputElement>

	const SetInputRef = useCallback((ref: typeof fileInputRef) => fileInputRef = ref, [])
	const AddFileInfos = useCallback((infos: FileInfo[]) => files.push(...infos), [])

	const ClearInput = useCallback(() => {
		const input = fileInputRef.current
		if(input?.files!.length) input.files = new DataTransfer().files
	}, [])

	return <>
		<Navigation />

		<main className={style.main}>
			<article>
				<section className={style.title}>Busque com rapidez e facilidade!</section>
				<section className={style.button}>
					<UploadForm {...{ setIsUploadMenu, AddFileInfos, SetInputRef, config }} />
				</section>
			</article>

			<aside>
				<Image src="/images/documents.png" alt="Ilustração de documentos" width={600} height={480} priority={true} quality={80} />
			</aside>

		</main>

		<UploadMenu {...{ inputFiles: files, isUploadMenu, setIsUploadMenu, ClearInput, types: config.types }} />
	</>
})

export default IndexPage
