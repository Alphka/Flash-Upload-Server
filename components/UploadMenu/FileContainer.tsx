import type { FileInfo, FileObject, FilesMap } from "../../typings"
import type { DocumentTypeInfo } from "../../typings/database"
import { memo, useCallback, useRef, useState } from "react"
import overflowStyle from "../../styles/modules/overflow.module.scss"

interface FileContainerProps {
	info: FileInfo
	types: DocumentTypeInfo[] | null
	setFile: (filename: string, data: FileObject) => any
	deleteFile: (filename: string, deleteContainer?: boolean) => any
}

function GetInputDate(date: string | number | Date){
	return new Date(date).toJSON().slice(0, 10)
}

const FileContainer = memo(({ info, setFile, deleteFile, types }: FileContainerProps) => {
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
		<section ref={container} className={overflowStyle.file}>
			<button className={`icon ${overflowStyle.delete} material-symbols-outlined`} onClick={() => deleteFile(info.name, true)}>delete</button>
			<p className="name">
				<span className={overflowStyle.label}>Nome</span>
				<span className={overflowStyle.content}>{info.name}</span>
			</p>
			<p className="mime">
				<span className={overflowStyle.label}>Tipo de arquivo</span>
				<span className={overflowStyle.content}>{info.type}</span>
			</p>
			<p className={overflowStyle.date}>
				<span className={overflowStyle.label}>Data de criação</span>
				<input type="date" defaultValue={GetInputDate(info.date)} ref={dateInput} />
			</p>
			<p className={overflowStyle.type}>
				<span className={overflowStyle.label}>Tipo de documento</span>
				<select className={overflowStyle.content} defaultValue={0} ref={typeSelect}>
					<option disabled hidden value={0}>Selecione um tipo</option>
					{types && types.map(({ id, name }) => (
						<option value={id} key={`documentType-${id}`}>{name}</option>
					))}
				</select>
			</p>
			{/* TODO: Only render this if user's access is all */}
			<p className={overflowStyle.checkbox}>
				<label>
					<input type="checkbox" ref={checkboxInput} />
					<span className={overflowStyle.label}>Arquivo privado</span>
				</label>
			</p>
			{errorMessage && <p className={overflowStyle.error}>{errorMessage}</p>}
		</section>
	)
})

export default FileContainer
