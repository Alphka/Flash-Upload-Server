import type { AccessTypes, DocumentTypeInfo } from "../../typings/database"
import type { FileInfo, FileObject } from "../../typings"
import type { APIUploadResponse } from "../../typings/api"
import { useState, useEffect, type CSSProperties } from "react"
import { toast } from "react-toastify"
import HandleRequestError from "../../helpers/HandleRequestError"
import ValidateFilename from "../../helpers/ValidateFilename"
import LocalInputDate from "../../helpers/LocalInputDate"
import FileContainer from "./FileContainer"
import axios from "axios"
import style from "../../styles/modules/upload-menu.module.scss"

interface UploadMenuProps {
	userAccess: AccessTypes
	types: DocumentTypeInfo[]
	inputFiles: FileInfo[]
	isUploadMenu: boolean
	setIsUploadMenu: (state: boolean) => any
	clearInput: () => any
}

export default function UploadMenu({ userAccess, types, inputFiles, isUploadMenu, setIsUploadMenu, clearInput }: UploadMenuProps){
	const [uploadPercentage, setUploadPercentage] = useState(0)
	const [isProgressBar, setIsProgressBar] = useState(false)
	const [submitBusy, setSubmitBusy] = useState(false)
	const [files, setFiles] = useState<Map<string, FileObject>>(new Map)

	function closeMenu(){
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
	}

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

	function setFile(filename: string, data: FileObject){
		files.set(filename, data)
	}

	function deleteFile(filename: string, deleteContainer?: boolean){
		inputFiles.splice(inputFiles.findIndex(info => info.name === filename), 1)
		files.delete(filename)

		setFiles(new Map(files))

		if(deleteContainer && !files.size){
			closeMenu()
			clearInput()
		}
	}

	if(!isUploadMenu) return null

	return (
		<div className={style.overflow}>
			<button className={`icon material-symbols-outlined ${style.close}`} onClick={closeMenu}>close</button>

			<article className={style.content}>
				<section className={style.header}>
					<h1 className={style.title}>Enviar arquivos</h1>
				</section>

				<section className={style.files}>
					{inputFiles.map(info => (
						<FileContainer {...{
							userAccess,
							info,
							types,
							setFile,
							deleteFile,
							key: info.name
						}} />
					))}
				</section>

				<section className={style.submit}>
					<input type="submit" value="Enviar" onClick={async () => {
						if(submitBusy) return

						const formData = new FormData()

						for(const file of files.values()){
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

							formData.set("date", LocalInputDate(dateInput.current!.value).toISOString())
							formData.set("expire", LocalInputDate(expireInput.current!.value).toISOString())
							formData.set("type", typeId)
							formData.set("isPrivate", userAccess === "all" && checkboxInput.current ? String(checkboxInput.current.checked) : "false")
							formData.set("image", blob, filename + "." + name.substring(name.lastIndexOf(".") + 1))

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

							// Handle each error
							for(const { filename, message } of response.data.errors){
								if(!filename){
									if(message) toast.error(`Erro: ${message}`)
									else console.error("Unknown API Error")
									continue
								}

								// TODO: If filename changes, this doesn't work
								const file = files.get(filename)
								const container = file?.references.container

								if(file && container) file.setErrorMessage(message)
								else toast.error(`O arquivo '${filename}' não pôde ser enviado`)
							}

							// Remove uploaded files
							for(const filename of response.data.uploaded){
								const file = files.get(filename)

								if(!file) continue
								if(file.getErrorMessage() !== null) file.setErrorMessage(null)

								deleteFile(filename, true)
							}

							if(response.data.message){
								toast[response.data.uploaded.length ? "success" : "error"](response.data.message)
							}
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
