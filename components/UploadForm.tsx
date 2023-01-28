import type { RefObject } from "react"
import type { FileInfo } from "../typings"
import type { Config } from "../typings/database"
import { memo, useRef } from "react"
import { toast } from "react-toastify"

interface UploadFormProps {
	config: Config
	setIsUploadMenu: (state: boolean) => any
	AddFileInfos: (infos: FileInfo[]) => any
	SetInputRef(ref: RefObject<HTMLInputElement>): any
}

const UploadForm = memo(function UploadForm({ config, setIsUploadMenu, AddFileInfos, SetInputRef }: UploadFormProps){
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

					if(!files?.length) return toast.error("Nenhum arquivo foi detectado")

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
						toast.error("Nenhum arquivo foi selecionado")

						return
					}

					const { maxFiles, maxFileSize } = config

					if(files.length > maxFiles){
						setIsUploadMenu(false)
						toast.error(`O número máximo de arquivos permitidos é ${maxFiles}`)

						return
					}

					const filesArray = Array.from(files)

					if(filesArray.some(file => file.size > maxFileSize)){
						const sizeMB = maxFileSize / 2**20
						const sizeString = `${sizeMB % 1 === 0 ? sizeMB : sizeMB.toFixed(2)} MB`

						setIsUploadMenu(false)
						toast.error(`O tamanho máximo por arquivo é ${sizeString}`)

						return
					}

					try{
						setIsUploadMenu(true)

						AddFileInfos(filesArray.map(file => {
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
})

export default UploadForm
