import type { AccessTypes, DocumentTypeInfo } from "../../typings/database"
import type { FileInfo, FileObject } from "../../typings"
import { memo, useCallback, useRef, useState } from "react"
import style from "../../styles/modules/upload-menu.module.scss"

interface FileContainerProps {
	userAccess: AccessTypes
	info: FileInfo
	types: DocumentTypeInfo[] | null
	setFile: (filename: string, data: FileObject) => any
	deleteFile: (filename: string, deleteContainer?: boolean) => any
}

function GetInputDate(date: string | number | Date){
	return new Date(date).toJSON().slice(0, 10)
}

const FileContainer = memo(({ userAccess, info, setFile, deleteFile, types }: FileContainerProps) => {
	const container = useRef<HTMLElement>(null)
	const dateInput = useRef<HTMLInputElement>(null)
	const typeSelect = useRef<HTMLSelectElement>(null)
	const checkboxInput = useRef<HTMLInputElement>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const getErrorMessage = useCallback(() => errorMessage, [errorMessage])

	setFile(info.name, {
		info,
		setErrorMessage,
		getErrorMessage,
		references: {
			container,
			dateInput,
			typeSelect,
			checkboxInput
		}
	})

	return (
		<section ref={container} className={style.file}>
			<button className={`icon ${style.delete} material-symbols-outlined`} onClick={() => deleteFile(info.name, true)}>delete</button>
			<p className="name">
				<span className={style.label}>Nome</span>
				<span className={style.content}>{info.name}</span>
			</p>
			<p className="mime">
				<span className={style.label}>Tipo de arquivo</span>
				<span className={style.content}>{info.type}</span>
			</p>
			<p className={style.date}>
				<span className={style.label}>Data de criação</span>
				<input type="date" defaultValue={GetInputDate(info.date)} ref={dateInput} />
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
