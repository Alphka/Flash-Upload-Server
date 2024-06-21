import type { APIFileObject } from "@api/files/typings"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { MdFolder } from "react-icons/md"
import style from "../documents.module.scss"
import Link from "next/link"

interface Folder {
	name: string
	count: number
	reduced: string
}

interface FoldersProps {
	folders: {
		[folderName: string]: Omit<Folder, "name"> & {
			files: APIFileObject[]
		}
	}
}

const Folders = memo<FoldersProps>(function Folders({ folders }){
	const [nameLength, setNameLength] = useState<number | undefined>(undefined)
	const filenameRef = useRef<HTMLSpanElement>(null)

	const updateLength = useCallback((element: HTMLSpanElement) => {
		const fontSize = Number(window.getComputedStyle(document.body).fontSize.match(/\d+/)![0])
		const length = Math.floor(element.clientWidth * 1.6 / fontSize)
		if(nameLength !== length) setNameLength(length)
	}, [nameLength])

	useEffect(() => {
		const element = filenameRef.current
		if(element) updateLength(element)
	})

	useEffect(() => {
		window.addEventListener("resize", () => {
			const element = filenameRef.current
			if(element) updateLength(element)
		})
	}, [])

	interface MoreDocumentsProps {
		href: string
		count: number
	}

	const MoreDocuments = memo(function MoreDocuments({ href, count }: MoreDocumentsProps){
		if(!count) return null

		const message = `mais ${count} ${count === 1 ? "arquivo" : "arquivos"}`

		return (
			<Link className={style.more} href={href} prefetch={false}>
				<span className="icon material-symbols-outlined">expand_more</span>
				<span>{message}</span>
			</Link>
		)
	})

	return (
		<div className={style.folders}>
			{Object.entries(folders).map(([folderName, { files, reduced, count }]) => {
				reduced = reduced.toLowerCase()

				files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

				return (
					<div className={style.folder} key={`folder-${reduced}`}>
						<div className={style.header}>
							<Link href={`/documents/${reduced}`} prefetch={false}>
								<MdFolder aria-hidden />
								<span className={style.title}>{folderName}</span>
							</Link>
						</div>

						<div className={style.content}>
							{files.map(({ filename, hash }) => (
								<span key={hash} className={style.file}>{filename}</span>
							))}

							<MoreDocuments href={`/documents/${reduced}`} count={count - files.length} />
						</div>
					</div>
				)
			})}
		</div>
	)
})

export default Folders
