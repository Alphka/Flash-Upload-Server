import type { APIResponse } from "../../../typings/api"
import type { Config } from "../../../typings/database"
import { memo, useRef, useState, type MouseEvent } from "react"
import { toast } from "react-toastify"
import PasswordInput from "./inputs/Password"
import FocusInput from "../helpers/FocusInput"
import Input from "./inputs"
import style from "../../../styles/modules/settings.module.scss"

interface AddUserProps {
	config: Config
}

function AddUser({ config = { accessTypes: [] } as unknown as Config }: AddUserProps){
	const { accessTypes } = config
	const usernameRef = useRef<HTMLInputElement>(null)
	const passwordRef = useRef<HTMLInputElement>(null)
	const accessRef = useRef<HTMLInputElement>(null)
	const submitRef = useRef<HTMLButtonElement>(null)
	const [usernameError, setUsernameError] = useState<string>()
	const [passwordError, setPasswordError] = useState<string>()
	const [accessError, setAccessError] = useState<string>()
	const [fetching, setFetching] = useState(false)

	function CreateUser(event: MouseEvent){
		event.preventDefault()

		if(fetching) return

		const usernameInput = usernameRef.current
		const passwordInput = passwordRef.current
		const accessInput = accessRef.current

		try{
			if(!usernameInput) throw "O elemento do usuário não foi encontrado"
			if(!passwordInput) throw "O elemento da senha não foi encontrado"
			if(!accessInput) throw "O elemento do acesso não foi encontrado"

			const username = usernameRef.current.value?.trim()
			const password = passwordRef.current.value?.trim()
			const access = accessRef.current.value?.trim()

			let errored = false

			if(usernameInput.checkValidity()) setUsernameError(undefined)
			else{
				setUsernameError(username ? "Campo de usuário inválido." : "O campo de usuário não pode estar vazio.")
				errored = true
			}

			if(passwordInput.checkValidity()) setPasswordError(undefined)
			else{
				setPasswordError(password ? "Campo de senha inválido." : "O campo de senha não pode estar vazio.")
				errored = true
			}

			if(accessInput.checkValidity()) setAccessError(undefined)
			else{
				if(access){
					accessInput.reportValidity()
					setAccessError(accessInput.validationMessage)
				}else setAccessError("O campo de acesso não pode estar vazio.")

				errored = true
			}

			if(errored) return

			return (async function Fetch(){
				setFetching(true)

				try{
					const response = await fetch("/api/user", {
						body: new URLSearchParams({ username, password, access }),
						method: "POST",
						credentials: "include"
					})

					const data: APIResponse = await response.json()

					if(data.success) toast.success("Usuário criado com sucesso")
					else toast.error(data.error)
				}finally{
					setFetching(false)
				}
			})()
		}catch(error){
			if(typeof error === "string") return toast.error(error)

			console.error(error)
			toast.error("Não foi possível criar o usuário")
		}
	}

	return (
		<div className={`${style.add} ${style.user}`}>
			<div className={style.header} onClick={() => usernameRef.current!.focus()}>
				<span className="icon material-symbols-outlined">add</span>
				<span className={style.username}>Adicionar usuário</span>
			</div>

			<div className={style.controls}>
				<Input {...{
					label: "Usuário:",
					color: "#29299d",
					required: true,
					autoComplete: "username",
					placeholder: "Ex: admin",
					className: "no-outline",
					ref: usernameRef,
					onKeyPress: FocusInput(passwordRef),
					error: usernameError
				}} />

				<PasswordInput error={passwordError} ref={passwordRef} />

				<Input {...{
					label: "Acesso:",
					color: "#005aff",
					required: true,
					pattern: accessTypes.join("|"),
					placeholder: `Ex: ${accessTypes.slice(0, 3).join(", ")}`,
					title: `Tipo de acesso (${accessTypes.join(", ")})`,
					list: "access-types",
					className: "no-outline",
					ref: accessRef,
					onKeyPress: FocusInput(passwordRef),
					error: accessError
				}} />

				<datalist id="access-types">
					{accessTypes.map((type, index) => (
						<option key={`access-type-${index}`} value={type} />
					))}
				</datalist>

				<div className={style.submit}>
					<button className={`no-outline ${style.submit}`} type="submit" ref={submitRef} onClick={CreateUser}>
						{fetching ? <div className={style.spinner}></div> : "Enviar"}
					</button>
				</div>
			</div>
		</div>
	)
}

export default memo(AddUser)
