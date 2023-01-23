import type { RefObject } from "react"
import type { FileInfo } from "../typings"
import { useCallback, useState } from "react"
import Image from "next/image"
import style from "../styles/index.module.scss"
import Navigation from "../components/Nav"
import UploadForm from "../components/UploadForm"
import UploadMenu from "../components/UploadMenu"

export default function IndexPage(){
	const [isUploadMenu, setIsUploadMenu] = useState(false)
	const [files, setFiles] = useState<FileInfo[]>([])

	let fileInputRef: RefObject<HTMLInputElement>

	function SetInputRef(ref: typeof fileInputRef){
		fileInputRef = ref
	}

	function AddFileInfos(infos: FileInfo[]){
		for(const info of infos) files.push(info)
		setFiles(files)
	}

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
					<UploadForm {...{ setIsUploadMenu, AddFileInfos, SetInputRef }} />
				</section>
			</article>

			<aside>
				<Image src="/images/documents.png" alt="Ilustração de documentos" loading="lazy" width={600} height={480} />
			</aside>

		</main>

		<UploadMenu {...{ inputFiles: files, isUploadMenu, setIsUploadMenu, ClearInput }} />
	</>
}
