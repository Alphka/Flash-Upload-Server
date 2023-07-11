import type { APIFilesFolderResponse } from "../api/files"
import type { GetServerSideProps } from "next"
import type { APIResponse, APIResponseError } from "../../typings/api"
import type { IUpdateDocument } from "../api/files/[hash]"
import type { DocumentsProps } from "."
import type { FileAccess } from "../../models/typings"
import type { Config, DocumentTypeInfo } from "../../typings/database"
import { memo, useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react"
import { toast, type ToastOptions } from "react-toastify"
import { GetCachedConfig } from "../../helpers/Config"
import { useRouter } from "next/router"
import HandleRequestError from "../../helpers/HandleRequestError"
import ValidateFilename from "../../helpers/ValidateFilename"
import GetDocumentType from "../../helpers/GetDocumentType"
import ConnectDatabase from "../../lib/ConnectDatabase"
import LocalInputDate from "../../helpers/LocalInputDate"
import GetExtension from "../../helpers/GetExtension"
import GetInputDate from "../../helpers/GetInputDate"
import GetFileName from "../../helpers/GetFileName"
import Navigation from "../../components/Navigation"
import getBaseURL from "../../helpers/getBaseURL"
import UserToken from "../../models/UserToken"
import useSWR from "swr"
import style from "../../styles/modules/documents.module.scss"
import Head from "next/head"
import Link from "next/link"

export const getServerSideProps: GetServerSideProps<DocumentFolderProps> = async ({ req, query: { folder } }) => {
	const { token } = req.cookies

	if(!token) return {
		redirect: {
			destination: "/",
			permanent: false
		}
	}

	if(typeof folder !== "string") return { notFound: true }

	try{
		await ConnectDatabase()

		const user = await UserToken.findOne({ token })

		if(!user) return {
			redirect: {
				destination: "/login",
				permanent: false
			}
		}

		const config = await GetCachedConfig(true)
		const documentType = GetDocumentType(config, folder)

		if(!documentType) return { notFound: true }

		// Redirect to reduced name
		if(documentType.reduced ? folder !== documentType.reduced.toLowerCase() : folder !== documentType.name.toLowerCase()) return {
			redirect: {
				destination: `/documents/${(documentType.reduced || documentType.name).toLowerCase()}`,
				permanent: false
			}
		}

		const url = new URL("/api/files", getBaseURL(req))

		url.searchParams.set("folder", folder)

		const response = await fetch(url, {
			headers: {
				Accept: "application/json",
				Authorization: token
			},
			credentials: "include"
		})

		const data = await response.json() as APIFilesFolderResponse | APIResponseError

		if(!data.success) return { notFound: true }

		const { files, type } = data.data

		return {
			props: {
				folder: documentType,
				files,
				config,
				userToken: user.token,
				userAccess: user.access,
			}
		}
	}catch(error){
		console.error(error)
		return { notFound: true }
	}
}

interface OverflowData {
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

	async function EditDocument(event: ReactMouseEvent){
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

	async function RemoveDocument(event: ReactMouseEvent){
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
								className="no-outline"
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
								className="no-outline"
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
								className="no-outline"
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
							<select defaultValue={accessFileIndex} className="no-outline" ref={accessRef} required>
								{config.accessFiles.map((name, index) => <option value={index} key={index}>{name}</option>)}
							</select>
						</label>
					</div>
				</section>

				<section className={style.submit}>
					<button className="no-outline" type="submit" onClick={EditDocument} ref={submitRef} disabled={fetching}>
						{fetching ? <div className={style.spinner}></div> : "Enviar"}
					</button>

					<button className={`no-outline ${style.remove}`} onClick={RemoveDocument} disabled={fetching}>
						{removing ? <div className={style.spinner}></div> : "Remover"}
					</button>
				</section>
			</article>
		</div>
	)
})

interface DocumentFolderProps extends DocumentsProps {
	folder: DocumentTypeInfo
	files: APIFilesFolderResponse["data"]["files"]
}

export default function DocumentFolder({ config, folder: { reduced, name: title }, userAccess, ...props }: DocumentFolderProps){
	const [files, setFiles] = useState<typeof props["files"]>([])
	const [toastConfig, setToastConfig] = useState<ToastOptions>({})
	const [clearErrors, setClearErrors] = useState(() => () => {})
	const [isOverflow, setIsOverflow] = useState(false)
	const [data, setData] = useState<OverflowData | undefined>()
	const hasAccess = userAccess === "all"
	const router = useRouter()

	const { data: swrData, error: swrError } = useSWR(`/api/files?folder=${reduced}`, async url => {
		const response = await fetch(url, { cache: "reload" })
		const json = await response.json() as APIFilesFolderResponse | APIResponseError

		if(!json.success) throw new Error(json.error || "Algo deu errado")

		return json.data.files
	})

	function sortFiles(files: typeof props["files"]){
		return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
	}

	useEffect(() => {
		if(swrData) setFiles(sortFiles(swrData))
		else if(swrError) toast.error(swrError)
	}, [swrData, swrError])

	useEffect(() => setFiles(sortFiles(props.files)), [router.query.folder])

	useEffect(() => setToastConfig(isOverflow ? { position: "bottom-right" } : {}), [isOverflow])

	const UpdateDocument = useCallback((hash: string, data?: IUpdateDocument) => {
		const file = files.find(file => file.hash === hash)

		if(!file) return

		// Remove document
		if(!data){
			if(files.length === 1){
				setFiles([])
				return router.push("/documents", undefined)
			}

			const index = files.indexOf(file)

			return setFiles([...files.slice(0, index), ...files.slice(index + 1)])
		}

		const { filename, access, createdDate, expireDate } = data

		if(filename) file.filename = filename
		if(access) file.access = access
		if(createdDate) file.createdAt = createdDate
		if(expireDate) file.expiresAt = expireDate

		setFiles(files.slice())
	}, [files])

	return <>
		<Head>
			<title>{`Flash - ${title || "Documentos"}`}</title>
			<meta property="og:title" content={`Flash - ${title}`} />
		</Head>

		<Navigation {...{ userAccess }} />

		<main className={style.list}>
			<header>
				<h1>{title}</h1>
				{reduced && <h2>({reduced})</h2>}
			</header>

			{/* TODO: Add button to redirect to /documents */}

			{files.length ? (
				<table>
					<thead>
						<tr>
							<td colSpan={hasAccess ? 2 : undefined}>Nome</td>
							<td>Data de criação</td>
							<td>Data de expiração</td>
						</tr>
					</thead>
					<tbody>
						{files.map(({ hash, filename, createdAt, expiresAt, access }) => (
							<tr key={hash}>
								{hasAccess && <td className={style.edit}>
									<span className="icon material-symbols-outlined" title="Editar documento" onClick={event => {
										event.currentTarget.blur()

										setData({
											name: GetFileName(filename),
											hash,
											access,
											filename,
											createdAt,
											expiresAt
										})

										clearErrors()
										setIsOverflow(true)
									}}>edit</span>
								</td>}
								<td className={style.filename}>
									<Link href={`/api/files/${hash}`} target="_blank" prefetch={false}>{filename}</Link>
								</td>
								<td>{new Date(createdAt).toLocaleDateString("pt-BR")}</td>
								<td>{new Date(expiresAt).toLocaleDateString("pt-BR")}</td>
							</tr>
						))}
					</tbody>
				</table>
			) : <p className={style.loading}>Carregando...</p>}
		</main>

		{data && <Overflow {...{
			config,
			UpdateDocument,
			isOverflow,
			setIsOverflow,
			data,
			setData,
			toastConfig,
			setClearErrors
		}} />}
	</>
}
