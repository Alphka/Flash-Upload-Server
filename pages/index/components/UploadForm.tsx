import type { Dispatch, RefObject, SetStateAction } from "react"
import type { FileInfo } from "../../../typings"
import { useRef } from "react"
import { toast } from "react-toastify"

interface UploadFormProps {
	setIsUploadMenu: Dispatch<SetStateAction<boolean>>
	AddFileInfos: (infos: FileInfo[]) => any
	SetInputRef(ref: RefObject<HTMLInputElement>): void
}

export default function UploadForm({ setIsUploadMenu, AddFileInfos, SetInputRef }: UploadFormProps){
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

					if(!files?.length) return toast.error("Nenhum arquivo foi detectado")

					if(filesInputRef.current){
						filesInputRef.current.files = files
						filesInputRef.current.dispatchEvent(new Event("change", { bubbles: true }))
					}
				}}
				onKeyPress={event => {
					if(event.key === "Enter"){
						event.preventDefault()
						filesInputRef.current?.click()
					}
				}
			}>
				Enviar documento
				<input tabIndex={-1} type="file" name="file" multiple aria-hidden ref={filesInputRef} onChange={(event) => {
					const { files } = event.target

					if(!files?.length){
						setIsUploadMenu(false)
						toast.error("Nenhum arquivo foi selecionado")
						return
					}

					try{
						setIsUploadMenu(true)

						AddFileInfos(Array.from(files).map(file => {
							const { name, type, size, lastModified: date } = file
							return { name, type, size, date, file } as FileInfo
						}))
					}catch(error){
						if(typeof error === "string") toast.error(error)
						console.error(error)
					}
				}} />
			</label>
		</form>
	)
}
