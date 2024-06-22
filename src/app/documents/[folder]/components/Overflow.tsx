import type { IUpdateDocument } from "@api/files/[hash]/typings"
import type { APIResponse } from "@typings/api"
import type { FileAccess } from "@models/typings"
import type { Config } from "@typings/database"
import { memo, useEffect, useRef, useState, type MouseEvent } from "react"
import { toast, type ToastOptions } from "react-toastify"
import HandleRequestError from "@helpers/HandleRequestError"
import ValidateFilename from "@helpers/ValidateFilename"
import LocalInputDate from "@helpers/LocalInputDate"
import GetExtension from "@helpers/GetExtension"
import GetInputDate from "@helpers/GetInputDate"
import style from "../../documents.module.scss"

export interface OverflowData {
	hash: string
	/** Filename without extension */
	name: string
	filename: string
	createdAt: string
	expiresAt: string
	access: FileAccess
}

interface OverflowProps {
	config: Config
	data: OverflowData
	isOverflow: boolean
	toastConfig: ToastOptions
	UpdateDocument: (hash: string, data?: IUpdateDocument) => void
	setData: (state: OverflowData | undefined) => void
	setIsOverflow: (state: boolean) => void
	setClearErrors: (clearErrors: () => void) => void
}

const Overflow = memo(function Overflow({ config, setIsOverflow, isOverflow, data, setData, UpdateDocument, toastConfig, setClearErrors }: OverflowProps){
	const [today] = useState(GetInputDate())
	const nameRef = useRef<HTMLInputElement>(null)
	const createdRef = useRef<HTMLInputElement>(null)
	const expireRef = useRef<HTMLInputElement>(null)
	const accessRef = useRef<HTMLSelectElement>(null)
	const submitRef = useRef<HTMLButtonElement>(null)
	const [createdError, setCreatedError] = useState<string>()
	const [expireError, setExpireError] = useState<string>()
	const [nameError, setNameError] = useState<string>()
	const [fetching, setFetching] = useState(false)
	const [removing, setRemoving] = useState(false)

	function EscListener(event: KeyboardEvent){
		if(!isOverflow || event.key !== "Escape" || event.shiftKey || event.ctrlKey) return

		event.preventDefault()
		CloseMenu()
	}

	function CloseMenu(){
		if(fetching) return

		if(document.body.dataset.overflow){
			delete document.body.dataset.overflow
			document.body.style.removeProperty("overflow")
			window.removeEventListener("keydown", EscListener)
		}

		setData(undefined)
		setIsOverflow(false)
		ClearErrors()
	}

	function ClearErrors(){
		setNameError(undefined)
		setCreatedError(undefined)
		setExpireError(undefined)
	}

	useEffect(() => {
		if(isOverflow && !document.body.dataset.overflow){
			document.body.dataset.overflow = "true"
			document.body.style.setProperty("overflow", "hidden")
			window.scrollTo(0, 0)
			window.addEventListener("keydown", EscListener)
		}
	})

	useEffect(() => setClearErrors(() => ClearErrors), [])

	async function FetchAPI(method: "GET" | "PUT" | "DELETE", messageSuccess?: string, documentData?: IUpdateDocument){
		const options: RequestInit = {
			headers: {
				Accept: "application/json,*/*",
			},
			method,
			credentials: "include"
		}

		if(documentData){
			Object.assign(options.headers!, { "Content-Type": "application/json" })

			if(documentData.expireDate) documentData.expireDate = LocalInputDate(documentData.expireDate).toISOString()
			if(documentData.createdDate) documentData.createdDate = LocalInputDate(documentData.createdDate).toISOString()

			options.body = JSON.stringify(documentData)
		}

		const response = await fetch(`/api/files/${data.hash}`, options)
		const json: APIResponse = await response.json()

		if(!json.success) throw json.error

		UpdateDocument(data.hash, documentData)
		CloseMenu()

		if(messageSuccess) toast.success(messageSuccess)
	}

	async function EditDocument(event: MouseEvent){
		event.preventDefault()

		if(fetching) return

		const filenameInput = nameRef.current
		const createdDateInput = createdRef.current
		const expireDateInput = expireRef.current
		const accessSelect = accessRef.current

		try{
			if(!filenameInput) throw "O elemento do nome do documento não foi encontrado"
			if(!createdDateInput) throw "O elemento da data de criação não foi encontrado"
			if(!expireDateInput) throw "O elemento da data de expiração não foi encontrado"
			if(!accessSelect) throw "O elemento do tipo de acesso não foi encontrado"

			const filename = filenameInput.value.trim()
			const createdDate = createdDateInput.value.trim()
			const expireDate = expireDateInput.value.trim()
			const access = accessSelect.options[accessSelect.selectedIndex]?.text as FileAccess | undefined

			let errored = false

			if(filenameInput.checkValidity()) setNameError(undefined)
			else setNameError(filename ? "Nome do documento inválido." : "O nome do documento não pode estar vazio."), errored = true

			if(createdDateInput.checkValidity()) setCreatedError(undefined)
			else setCreatedError(createdDateInput.validationMessage), errored = true

			if(expireDateInput.checkValidity()) setExpireError(undefined)
			else setExpireError(expireDateInput.validationMessage), errored = true

			// Type checking
			if(errored || !access) return

			const documentData: IUpdateDocument = {
				filename: `${filename}.${GetExtension(data.filename)}`,
				access,
				createdDate,
				expireDate
			}

			const conditions = [
				filename === data.name,
				access === data.access,
				createdDate === GetInputDate(data.createdAt),
				expireDate === GetInputDate(data.expiresAt)
			] as const

			if(conditions.every(Boolean)){
				toast.error("Nenhuma informação foi alterada", toastConfig)
				return
			}

			if(conditions[0]) delete documentData.filename
			if(conditions[1]) delete documentData.access
			if(conditions[2]) delete documentData.createdDate
			if(conditions[3]) delete documentData.expireDate

			try{
				setFetching(true)
				await FetchAPI("PUT", "Documento editado com sucesso", documentData)
			}catch(error: any){
				HandleRequestError(error)
			}finally{
				setFetching(false)
			}
		}catch(error){
			if(typeof error === "string") return toast.error(error, toastConfig)

			console.error(error)
			toast.error("Não foi possível editar o documento", toastConfig)
		}
	}

	async function RemoveDocument(event: MouseEvent){
		event.preventDefault()

		try{
			setRemoving(true)
			await FetchAPI("DELETE", "Documento removido com sucesso")
		}catch(error: any){
			HandleRequestError(error)
		}finally{
			setRemoving(false)
		}
	}

	if(!isOverflow) return null

	const accessFileIndex = config.accessFiles.findIndex(name => name === data.access)

	return (
		<div className={style.overflow}>
			<button className={`icon material-symbols-outlined ${style.close}`} onClick={CloseMenu}>close</button>

			<article className={style.content}>
				<section className={style.header}>
					<h1 className={style.title}>Editar documento</h1>
				</section>

				<section className={style.form}>
					<div>
						<label>
							<span>Nome do documento: </span>
							<input type="text"
								defaultValue={data.name}
								className="outline-none"
								onKeyPress={event => {
									const input = event.target as HTMLInputElement

									if(nameError && ValidateFilename(input.value.trim())) setNameError(undefined)
									if(event.key === "Enter") event.preventDefault(), createdRef.current!.focus()
								}}
								ref={nameRef}
								required
							/>
						</label>
						{nameError && <span className={style.error}>{nameError}</span>}
					</div>
					<div>
						<label>
							<span>Data de criação: </span>
							<input type="date"
								defaultValue={GetInputDate(data.createdAt)}
								max={today}
								className="outline-none"
								onChange={event => createdError && event.currentTarget.checkValidity() && setCreatedError(undefined)}
								ref={createdRef}
								required
							/>
						</label>
						{createdError && <span className={style.error}>{createdError}</span>}
					</div>
					<div>
						<label>
							<span>Data de expiração: </span>
							<input type="date"
								defaultValue={GetInputDate(data.expiresAt)}
								min={today}
								className="outline-none"
								onChange={event => expireError && event.currentTarget.checkValidity() && setExpireError(undefined)}
								ref={expireRef}
								required
							/>
						</label>
						{expireError && <span className={style.error}>{expireError}</span>}
					</div>
					<div>
						<label>
							<span>Tipo de acesso: </span>
							<select defaultValue={accessFileIndex} className="outline-none" ref={accessRef} required>
								{config.accessFiles.map((name, index) => <option value={index} key={index}>{name}</option>)}
							</select>
						</label>
					</div>
				</section>

				<section className={style.submit}>
					<button className="outline-none" type="submit" onClick={EditDocument} ref={submitRef} disabled={fetching}>
						{fetching ? <div className={style.spinner}></div> : "Enviar"}
					</button>

					<button className={`outline-none ${style.remove}`} onClick={RemoveDocument} disabled={fetching}>
						{removing ? <div className={style.spinner}></div> : "Remover"}
					</button>
				</section>
			</article>
		</div>
	)
})

export default Overflow
