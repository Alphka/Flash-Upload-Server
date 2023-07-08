import type { AccessTypes, DocumentTypeInfo } from "../../typings/database"
import type { FileInfo, FileObject } from "../../typings"
import { memo, useCallback, useRef, useState } from "react"
import GetInputDate from "../../helpers/GetInputDate"
import style from "../../styles/modules/homepage.module.scss"

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

	const handleDelete = useCallback(() => deleteFile(id, true), [id])
	const expireDate = new Date(info.date)

	// TODO: Get year from config, for each document type
	expireDate.setFullYear(expireDate.getFullYear() + 5)

	return (
		<section ref={container} className={style.file}>
			<div>
				<label>
					<span>Nome</span>
					<input type="text" defaultValue={info.name.substring(0, info.name.lastIndexOf("."))} ref={nameInput} />
				</label>
			</div>
			<div>
				<label>
					<span>Data de criação</span>
					<input type="date" defaultValue={GetInputDate(info.date)} ref={dateInput} />
				</label>
			</div>
			<div>
				<label>
					<span>Tipo de arquivo</span>
					<input type="text" value={info.type} disabled />
				</label>
			</div>
			<div>
				<label>
					<span>Data de expiração</span>
					<input type="date" defaultValue={GetInputDate(expireDate)} ref={expireInput} />
				</label>
			</div>
			<div>
				<label>
					<span>Tipo de documento</span>
					<select defaultValue={0} ref={typeSelect}>
						<option disabled hidden value={0}>Selecione um tipo</option>
						{types && types.map(({ id, name }) => (
							<option value={id} key={`documentType-${id}`}>{name}</option>
						))}
					</select>
				</label>
			</div>
			{userAccess === "all" && (
				<div className={style.checkbox}>
					<label>
						<input type="checkbox" ref={checkboxInput} />
						<span>Arquivo privado</span>
					</label>
				</div>
			)}
			<button className={style.delete} onClick={handleDelete}>
				<span className="icon material-symbols-outlined">delete</span>
				<span>Remover</span>
			</button>
			{errorMessage && <p className={style.error}>{errorMessage}</p>}
		</section>
	)
})

export default FileContainer
