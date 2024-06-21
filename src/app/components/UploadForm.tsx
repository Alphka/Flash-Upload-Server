import { memo, useRef, type RefObject } from "react"
import { toast, type ToastOptions } from "react-toastify"
import { FileInfo } from "@typings"
import { Config } from "@typings/database"

interface UploadFormProps {
	config: Config
	toastConfig: ToastOptions
	setIsUploadMenu: (state: boolean) => any
	AddFileInfos: (infos: FileInfo[]) => any
	SetInputRef(ref: RefObject<HTMLInputElement>): any
}

const UploadForm = memo(function UploadForm({ config, setIsUploadMenu, toastConfig, AddFileInfos, SetInputRef }: UploadFormProps){
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

					if(!files?.length) return toast.error("Nenhum arquivo foi detectado", toastConfig)

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
					const { files } = event.currentTarget

					if(!files) return toast.error("Algo deu errado")

					if(!files.length){
						setIsUploadMenu(false)
						return toast.error("Nenhum arquivo foi selecionado", toastConfig)
					}

					const { maxFiles, maxFileSize } = config

					if(files.length > maxFiles){
						setIsUploadMenu(false)
						return toast.error(`O número máximo de arquivos permitidos é ${maxFiles}`, toastConfig)
					}

					const filesArray = Array.from(files)

					if(filesArray.some(file => file.size > maxFileSize)){
						const sizeMB = maxFileSize / 1048576
						const sizeString = `${sizeMB % 1 === 0 ? sizeMB : sizeMB.toFixed(2)} MB`

						setIsUploadMenu(false)
						return toast.error(`O tamanho máximo por arquivo é ${sizeString}`, toastConfig)
					}

					const invalidFiles = filesArray.filter(file => !file.type)

					if(invalidFiles.length){
						const { length } = invalidFiles

						if(length === 1){
							toast.error("Arquivo inválido")
							return setIsUploadMenu(false)
						}

						if(length === filesArray.length){
							toast.error("Arquivos inválidos")
							return setIsUploadMenu(false)
						}

						const indexes = invalidFiles.map(file => filesArray.indexOf(file))

						for(const index of indexes.reverse()) filesArray.splice(index, 1)

						toast.error("Arquivos inválidos removidos")
					}

					setIsUploadMenu(true)

					try{
						AddFileInfos(filesArray.map(file => {
							const { name, type, size, lastModified: date } = file
							return { name, type, size, date, file, show: true } as FileInfo
						}))
					}catch(error){
						if(typeof error === "string") return toast.error(error, toastConfig)
						console.error(error)
					}
				}} />
			</label>
		</form>
	)
})

export default UploadForm
