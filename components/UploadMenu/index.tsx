import type { AccessTypes, DocumentTypeInfo } from "../../typings/database"
import type { FileInfo, FileObject } from "../../typings"
import type { APIUploadResponse } from "../../typings/api"
import { useState, useEffect, useCallback, type CSSProperties } from "react"
import { toast, type ToastOptions } from "react-toastify"
import { useRouter } from "next/router"
import HandleRequestError from "../../helpers/HandleRequestError"
import ValidateFilename from "../../helpers/ValidateFilename"
import LocalInputDate from "../../helpers/LocalInputDate"
import FileContainer from "./FileContainer"
import GetExtension from "../../helpers/GetExtension"
import axios from "axios"
import style from "../../styles/modules/homepage.module.scss"

interface UploadMenuProps {
	toastConfig: ToastOptions
	userAccess: AccessTypes
	inputFiles: FileInfo[]
	isUploadMenu: boolean
	types: DocumentTypeInfo[]
	setIsUploadMenu: (state: boolean) => any
	clearInput: () => any
}

export default function UploadMenu({ userAccess, types, inputFiles, toastConfig, isUploadMenu, setIsUploadMenu, clearInput }: UploadMenuProps){
	const [uploadPercentage, setUploadPercentage] = useState(0)
	const [isProgressBar, setIsProgressBar] = useState(false)
	const [submitBusy, setSubmitBusy] = useState(false)
	const [files, setFiles] = useState<Map<number, FileObject>>(new Map)
	const router = useRouter()

	const closeMenu = useCallback(() => {
		if(submitBusy) return

		inputFiles.splice(0, inputFiles.length)
		setFiles(new Map)

		if(document.body.dataset.overflow){
			delete document.body.dataset.overflow
			document.body.style.removeProperty("overflow")
			window.removeEventListener("keydown", EscListener)
		}

		clearInput()
		setIsUploadMenu(false)
	}, [submitBusy])

	function EscListener(event: KeyboardEvent){
		if(!isUploadMenu) return
		if(event.key !== "Escape") return
		if(event.shiftKey) return
		if(event.ctrlKey) return

		const { tagName } = event.target as HTMLElement
		const allowedTags = ["input", "select", "button"]

		if(allowedTags.includes(tagName.toLowerCase())) return

		event.preventDefault()
		closeMenu()
	}

	useEffect(() => {
		if(isUploadMenu && !document.body.dataset.overflow){
			document.body.dataset.overflow = "true"
			document.body.style.setProperty("overflow", "hidden")
			window.scrollTo(0, 0)
			window.addEventListener("keydown", EscListener)
		}

		if(!isProgressBar && uploadPercentage !== 0) setUploadPercentage(0)
	})

	const setFile = useCallback((id: number, data: FileObject) => files.set(id, data), [files])

	const deleteFile = useCallback((id: number, deleteContainer?: boolean) => {
		if(!files.has(id)) return !files.size

		inputFiles[id].show = false
		files.delete(id)

		const shouldClose = !files.size

		if(deleteContainer && shouldClose) closeMenu()

		setFiles(new Map(files))

		return shouldClose
	}, [inputFiles, files])

	if(!isUploadMenu) return null

	return (
		<div className={style.overflow}>
			<button className={`icon material-symbols-outlined ${style.close}`} onClick={closeMenu}>close</button>

			<article className={style.content}>
				<section className={style.header}>
					<h1 className={style.title}>Enviar arquivos</h1>
				</section>

				<section className={style.files}>
					{inputFiles.map((info, id) => {
						if(!info.show) return null

						return <FileContainer {...{
							id,
							userAccess,
							info,
							types,
							setFile,
							deleteFile,
							key: info.name
						}} />
					})}
				</section>

				<section className={style.submit}>
					<input type="submit" value="Enviar" onClick={async () => {
						if(submitBusy) return

						const formData = new FormData()

						for(const [id, file] of files.entries()){
							const { info: { name, file: blob }, references, getErrorMessage, setErrorMessage } = file
							const { nameInput, dateInput, expireInput, typeSelect, checkboxInput } = references

							const filename = nameInput.current!.value
							const typeId = typeSelect.current!.value

							if(!filename || !ValidateFilename(filename)){
								setErrorMessage("Nome do arquivo inválido")
								continue
							}

							if(typeId === "0"){
								setErrorMessage("Tipo de documento inválido")
								continue
							}

							formData.append("id", id.toString())
							formData.append("date", LocalInputDate(dateInput.current!.value).toISOString())
							formData.append("expire", LocalInputDate(expireInput.current!.value).toISOString())
							formData.append("type", typeId)
							formData.append("isPrivate", userAccess === "all" && checkboxInput.current ? String(checkboxInput.current.checked) : "false")
							formData.append("image", blob, `${filename}.${GetExtension(name)}`)

							if(getErrorMessage() !== null) setErrorMessage(null)
						}

						// No files
						if(!Array.from(formData.entries()).length) return

						setSubmitBusy(true)
						setIsProgressBar(true)

						try{
							const response = await axios.post<APIUploadResponse>("/api/upload", formData, {
								headers: {
									"Accept": "application/json",
									"Content-Type": "multipart/form-data"
								},
								withCredentials: true,
								onUploadProgress: progressEvent => {
									const progress = progressEvent.progress
										? progressEvent.progress * 100
										: (progressEvent.loaded * 100 / progressEvent.total!)

									setUploadPercentage(Math.trunc(progress))
								}
							})

							// Type assertion
							if(!response.data.success) throw "Upload failed"

							const { errors, message, uploaded } = response.data

							// Handle each error
							for(const { id, message } of errors){
								if(!id && id !== 0){
									if(message) toast.error(`Erro: ${message}`, toastConfig)
									else console.error("Unknown API Error")
									continue
								}

								const file = files.get(id)
								const container = file?.references.container

								if(file && container) file.setErrorMessage(message)
							}

							let shouldClose = false

							// Remove uploaded files
							for(const id of uploaded){
								const file = files.get(id)

								if(!file) continue
								if(file.getErrorMessage() !== null) file.setErrorMessage(null)

								shouldClose = deleteFile(id, true)
							}

							if(shouldClose && !errors.length){
								router.push("/documents")
								toast.success(message)
								return
							}

							if(message) toast[uploaded.length ? "success" : "error"](message, toastConfig)
						}catch(error){
							HandleRequestError(error)
						}finally{
							setSubmitBusy(false)
							setIsProgressBar(false)
						}
					}} />

					{isProgressBar && (
						<div className={style.progress}>
							<div className={style.bar} style={{ "--width": uploadPercentage + "%" } as CSSProperties}></div>
							<span className={style.percentage}>{uploadPercentage}%</span>
						</div>
					)}
				</section>
			</article>
		</div>
	)
}
