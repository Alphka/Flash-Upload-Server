import type { AccessTypes, DocumentTypeInfo } from "../../typings/database"
import type { FileInfo, FileObject } from "../../typings"
import { memo, useCallback, useRef, useState } from "react"
import GetInputDate from "../../helpers/GetInputDate"
import style from "../../styles/modules/upload-menu.module.scss"

interface FileContainerProps {
	id: number
	userAccess: AccessTypes
	info: FileInfo
	types: DocumentTypeInfo[] | null
	setFile: (id: number, data: FileObject) => any
	deleteFile: (id: number, deleteContainer?: boolean) => any
}

const FileContainer = memo(({ id, userAccess, info, setFile, deleteFile, types }: FileContainerProps) => {
	const container = useRef<HTMLElement>(null)
	const nameInput = useRef<HTMLInputElement>(null)
	const dateInput = useRef<HTMLInputElement>(null)
	const typeSelect = useRef<HTMLSelectElement>(null)
	const expireInput = useRef<HTMLInputElement>(null)
	const checkboxInput = useRef<HTMLInputElement>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const getErrorMessage = useCallback(() => errorMessage, [errorMessage])

	setFile(id, {
		info,
		setErrorMessage,
		getErrorMessage,
		references: {
			container,
			nameInput,
			dateInput,
			typeSelect,
			expireInput,
			checkboxInput
		}
	})

	const handleDelete = useCallback(() => deleteFile(id, true), [])

	const expireDate = new Date(info.date)

	// TODO: Get year from config, for each document type
	expireDate.setFullYear(expireDate.getFullYear() + 5)

	return (
		<section ref={container} className={style.file}>
			<button className={`icon ${style.delete} material-symbols-outlined`} onClick={handleDelete}>delete</button>
			<p className={style.name}>
				<span className={style.label}>Nome</span>
				<input type="text" defaultValue={info.name.substring(0, info.name.lastIndexOf("."))} ref={nameInput} />
			</p>
			<p>
				<span className={style.label}>Tipo de arquivo</span>
				<span className={style.content}>{info.type}</span>
			</p>
			<p className={style.date}>
				<span className={style.label}>Data de criação</span>
				<input type="date" defaultValue={GetInputDate(info.date)} ref={dateInput} />
			</p>
			<p className={style.date}>
				<span className={style.label}>Data de expiração</span>
				<input type="date" defaultValue={GetInputDate(expireDate)} ref={expireInput} />
			</p>
			<p className={style.type}>
				<span className={style.label}>Tipo de documento</span>
				<select className={style.content} defaultValue={0} ref={typeSelect}>
					<option disabled hidden value={0}>Selecione um tipo</option>
					{types && types.map(({ id, name }) => (
						<option value={id} key={`documentType-${id}`}>{name}</option>
					))}
				</select>
			</p>
			{userAccess === "all" && (
				<p className={style.checkbox}>
					<label>
						<input type="checkbox" ref={checkboxInput} />
						<span className={style.label}>Arquivo privado</span>
					</label>
				</p>
			)}
			{errorMessage && (
				<p className={style.error}>{errorMessage}</p>
			)}
		</section>
	)
})

export default FileContainer
