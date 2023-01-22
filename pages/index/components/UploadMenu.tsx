import type { APIResponse, APIResponseError, APIUploadResponse } from "../../../typings/api"
import type { Dispatch, SetStateAction, CSSProperties } from "react"
import type { FileInfo, FilesMap } from "../../../typings"
import type { DocumentTypeInfo } from "../../../typings/database"
import type { AxiosError } from "axios"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import axios from "axios"
import FileContainer from "./FileContainer"
import overflowStyle from "../styles/overflow.module.scss"

interface UploadMenuProps {
	inputFiles: FileInfo[]
	setIsUploadMenu: Dispatch<SetStateAction<boolean>>
	isUploadMenu: boolean
	ClearInput: () => any
}

function HandleRequestError(error: any){
	if(error.isAxiosError){
		const { message, response } = error as AxiosError<APIResponseError>
		toast.error(response?.data.error ?? "Algo deu errado")
		console.error(message)
		return
	}

	console.error(error)
}

export default function UploadMenu({ inputFiles, isUploadMenu, setIsUploadMenu, ClearInput }: UploadMenuProps){
	const [uploadPercentage, setUploadPercentage] = useState(0)
	const [isProgressBar, setIsProgressBar] = useState(false)
	const [files, setFiles] = useState<FilesMap>(new Map)
	const [types, setTypes] = useState<DocumentTypeInfo[] | null>(null)
	const [isFetching, setIsFetching] = useState(false)
	const [submitBusy, setSubmitBusy] = useState(false)

	function CloseMenu(){
		if(submitBusy) return

		inputFiles.splice(0, inputFiles.length)
		setFiles(new Map)

		if(document.body.dataset.overflow){
			delete document.body.dataset.overflow
			document.body.style.removeProperty("overflow")
			window.removeEventListener("keydown", EscListener)
		}

		ClearInput()
		setIsUploadMenu(false)
	}

	function EscListener(event: KeyboardEvent){
		if(
			!isUploadMenu ||
			event.key !== "Escape" ||
			event.shiftKey ||
			event.ctrlKey ||
			["input", "select", "button"].includes((event.target as HTMLElement)?.tagName.toLowerCase())
		) return

		event.preventDefault()
		CloseMenu()
	}

	useEffect(() => {
		if(isUploadMenu && !document.body.dataset.overflow){
			document.body.dataset.overflow = "true"
			document.body.style.setProperty("overflow", "hidden")
			window.addEventListener("keydown", EscListener)
		}
	})

	useEffect(() => {
		setIsFetching(true)

		axios.get<APIResponse<DocumentTypeInfo[]>>("/api/config/types", {
			headers: { "Accept": "application/json" },
			withCredentials: true,
			responseType: "json"
		}).then(response => {
			if(response.data.success) setTypes(response.data.data!)
			else toast.error(response.data.error)

			setIsFetching(false)
		}).catch((error: AxiosError) => {
			toast.error(error.response?.statusText || "Erro: Não foi possível definir os tipos de documentos")
		})
	}, [])

	function deleteFile(filename: string, deleteContainer?: boolean){
		inputFiles.splice(inputFiles.findIndex(info => info.name === filename), 1)
		files.delete(filename)

		setFiles(new Map(files))

		if(deleteContainer && !files.size){
			CloseMenu()
			ClearInput()
		}
	}

	if(!isUploadMenu) return null

	return (
		<div className={overflowStyle.overflow}>
			<button className={`icon ${overflowStyle.close} material-symbols-outlined`} onClick={CloseMenu}>close</button>

			<article>
				<section className={overflowStyle.header}>
					<h1 className={overflowStyle.title}>Enviar arquivos</h1>
				</section>

				<section className={overflowStyle.files}>
					{inputFiles.map(info => (
						<FileContainer key={info.name} {...{ files, info, deleteFile, types }} />
					))}
				</section>

				<section className={overflowStyle.submit}>
					<input type="button" value="Enviar" onClick={async () => {
						if(submitBusy) return

						const gmt = new Date().toTimeString().match(/GMT[-+]\d{4}/)![0]
						const formData = new FormData()

						for(const file of files.values()){
							const { info, references, getErrorMessage, setErrorMessage } = file
							const { dateInput, typeSelect, checkboxInput } = references
							const { name, file: fileBlob } = info

							const typeId = typeSelect.current!.value

							if(typeId === "0"){
								setErrorMessage("Tipo de documento inválido")
								continue
							}

							formData.append("date", new Date(`${dateInput.current!.value} ${gmt}`).toISOString())
							formData.append("type", typeId)
							formData.append("isPrivate", String(checkboxInput.current!.checked))
							formData.append("image", fileBlob, name)

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

									setUploadPercentage(progress)
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

							if(response.data.message) toast.success(response.data.message)
						}catch(error){
							HandleRequestError(error)
						}finally{
							setSubmitBusy(false)
							setIsProgressBar(false)
						}
					}} />

					{isProgressBar && (
						<div className={overflowStyle.progress}>
							<div className={overflowStyle.bar} style={{ "--width": uploadPercentage + "%" } as CSSProperties}></div>
							<span className={overflowStyle.percentage}>{uploadPercentage}%</span>
						</div>
					)}
				</section>
			</article>
		</div>
	)
}
