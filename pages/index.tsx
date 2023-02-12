import type { GetServerSideProps } from "next"
import type { AccessTypes } from "../models/User"
import type { FileInfo } from "../typings"
import type { Config } from "../typings/database"
import { memo, useCallback, useState } from "react"
import { useEffect, type RefObject } from "react"
import { GetCachedConfig } from "../helpers/Config"
import { useRouter } from "next/router"
import { toast } from "react-toastify"
import ConnectDatabase from "../lib/ConnectDatabase"
import Unauthorize from "../helpers/Unauthorize"
import UserToken from "../models/UserToken"
import Image from "next/image"
import style from "../styles/modules/index.module.scss"
import Navigation from "../components/Navigation"
import UploadForm from "../components/UploadForm"
import UploadMenu from "../components/UploadMenu"

interface IndexProps {
	config: Config
	userAccess: AccessTypes
}

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

const IndexPage = memo(function Index({ config, userAccess }: IndexProps){
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
		<Navigation {...{ userAccess }} />

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
