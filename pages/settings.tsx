import type { InputHTMLAttributes, MouseEvent, SyntheticEvent } from "react"
import type { Config, AccessTypes } from "../typings/database"
import type { GetServerSideProps } from "next"
import type { APIResponse } from "../typings/api"
import type { IUser } from "../models/typings"
import { memo, forwardRef, useRef, useState, useCallback, useEffect } from "react"
import { GetCachedConfig } from "../helpers/Config"
import { IUpdateUser } from "./api/user"
import { toast } from "react-toastify"
import HandleRequestError from "../helpers/HandleRequestError"
import useForwardedRef from "../helpers/useForwardedRef"
import ConnectDatabase from "../lib/ConnectDatabase"
import Unauthorize from "../helpers/Unauthorize"
import Navigation from "../components/Navigation"
import UserToken from "../models/UserToken"
import UserDb from "../models/User"
import style from "../styles/modules/settings.module.scss"
import Head from "next/head"

const title = "Configurações"
const description = "Página de configuração do site."

interface UserProps {
	username: string
	password: string
	access: AccessTypes
	clearErrors: () => void
	setData: (state: OverflowData) => any
	removeUser: (username: string) => any
	setIsOverflow: (state: boolean) => any
}

const User = memo(function User({ username, password, access, removeUser, clearErrors, setData, setIsOverflow }: UserProps){
	const passwordRef = useRef<HTMLSpanElement>(null)

	return (
		<div className={`${style.user} ${style.cell}`}>
			<div className={style.header}>
				<span className="icon material-symbols-outlined">person</span>
				<span className={style.username}>{username}</span>
				<span className={`icon ${style.remove} material-symbols-outlined`} title="Remover usuário" onClick={async event =>{
					event.preventDefault()

					try{
						const response = await fetch("/api/user", {
							body: new URLSearchParams({ username }),
							method: "DELETE",
							credentials: "include"
						})

						const data = await response.json() as APIResponse

						if(!data.success) throw data.error

						const { message } = data

						removeUser(username)
						toast.success("Usuário removido com sucesso")

						if(message) toast.error(message)
					}catch(error){
						HandleRequestError(error)
					}
				}}>close</span>
			</div>

			<div className={style.controls}>
				<span className={style.label}>
					Senha: <span
						className={`${style.password} ${style.disc}`}
						onMouseDown={event => event.detail > 1 && event.preventDefault()}
						onClick={event => event.currentTarget.classList.toggle(style.disc)}
						onKeyPress={event => event.key === "Enter" && event.currentTarget.blur()}
						ref={passwordRef}
					>{password}</span>
				</span>
				<span className={style.label}>Acesso: {access}</span>
				<button className={`no-outline ${style.edit}`} onClick={event => {
					event.currentTarget.blur()
					setData({ username, password, access })
					clearErrors()
					setIsOverflow(true)
				}}>Editar</button>
			</div>
		</div>
	)
})

interface AddUserProps {
	config: Config
	addUser: (user: IUser) => any
	setClearErrors: (clearErrors: () => void) => any
}

const AddUser = memo(function AddUser({ config, addUser, setClearErrors }: AddUserProps){
	const usernameRef = useRef<HTMLInputElement>(null)
	const passwordRef = useRef<HTMLInputElement>(null)
	const accessRef = useRef<HTMLInputElement>(null)
	const submitRef = useRef<HTMLButtonElement>(null)
	const [usernameError, setUsernameError] = useState<string>()
	const [passwordError, setPasswordError] = useState<string>()
	const [accessError, setAccessError] = useState<string>()
	const [fetching, setFetching] = useState(false)

	useEffect(() => {
		setClearErrors(() => () => {
			setUsernameError(undefined)
			setPasswordError(undefined)
			setAccessError(undefined)
		})
	}, [])

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

			const username = usernameInput.value?.trim()
			const password = passwordInput.value?.trim()
			const access = accessInput.value?.trim() as AccessTypes | "" | undefined

			let errored = false

			if(usernameInput.checkValidity()) setUsernameError(undefined)
			else setUsernameError(username ? "Campo de usuário inválido." : "O campo de usuário não pode estar vazio."), errored = true

			if(passwordInput.checkValidity()) setPasswordError(undefined)
			else setPasswordError(password ? "Campo de senha inválido." : "O campo de senha não pode estar vazio."), errored = true

			if(accessInput.checkValidity()) setAccessError(undefined)
			else{
				if(access){
					accessInput.reportValidity()
					setAccessError(accessInput.validationMessage)
				}else setAccessError("O campo de acesso não pode estar vazio.")

				errored = true
			}

			// Type checking
			if(errored || !access) return

			return (async function Fetch(){
				setFetching(true)

				try{
					const response = await fetch("/api/user", {
						body: new URLSearchParams({ username, password, access }),
						method: "POST",
						credentials: "include"
					})

					const data: APIResponse = await response.json()

					if(!data.success) throw data.error

					addUser({ name: username, password, access })

					usernameInput.value = passwordInput.value = accessInput.value = ""
					passwordInput.dispatchEvent(new Event("input", { bubbles: true }))

					toast.success("Usuário criado com sucesso")
				}catch(error: any){
					HandleRequestError(error)
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
		<div className={`${style.add} ${style.cell}`}>
			<div className={style.header} onClick={() => usernameRef.current!.focus()}>
				<span className="icon material-symbols-outlined">add</span>
				<span className={style.username}>Adicionar usuário</span>
			</div>

			<div className={style.form}>
				<Input label="Usuário:"
					name="user"
					autoComplete="username"
					placeholder="Ex: admin"
					className="no-outline"
					onKeyPress={event => {
						const input = event.target as HTMLInputElement

						if(usernameError && input.value.trim()) setUsernameError(undefined)
						if(event.key === "Enter") event.preventDefault(), passwordRef.current!.focus()
					}}
					error={usernameError}
					ref={usernameRef}
					required
				/>

				<PasswordInput label="Senha:"
					name="password"
					autoComplete="new-password"
					className="no-outline"
					onKeyPress={event => {
						const input = event.target as HTMLInputElement

						if(passwordError && input.value.trim()) setPasswordError(undefined)
						if(event.key === "Enter") event.preventDefault(), accessRef.current!.focus()
					}}
					error={passwordError}
					ref={passwordRef}
					required
				/>

				<Input label="Acesso:"
					name="access"
					list="access-types"
					className="no-outline"
					title={`Tipo de acesso (${config.accessTypes.join(", ")})`}
					pattern={config.accessTypes.join("|")}
					placeholder={`Ex: ${config.accessTypes.slice(0, 3).join(", ")}`}
					onKeyPress={event => {
						const input = event.target as HTMLInputElement
						const value = input.value = input.value.trim()

						if(accessError && value && config.accessTypes.includes(value.toLowerCase() as AccessTypes)){
							setAccessError(undefined)
						}

						if(event.key === "Enter"){
							event.preventDefault()
							submitRef.current!.click()
						}
					}}
					error={accessError}
					ref={accessRef}
					required
				/>

				<div className={style.submit}>
					<button className="no-outline" type="submit" ref={submitRef} onClick={CreateUser}>
						{fetching ? <div className={style.spinner}></div> : "Enviar"}
					</button>
				</div>
			</div>
		</div>
	)
})

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string
	error: string | undefined
	icon?: JSX.Element | null
}

const Input = memo(forwardRef<HTMLInputElement, InputProps>(function Input({
	label,
	error,
	type = "text",
	icon,
	...rest
}, ref){
	const props = {
		...rest,
		type,
		ref
	}

	return (
		<div>
			<label>
				<span className={style.label}>{label}</span>
				<input {...props} />
			</label>
			{error && <span className={style.error}>{error}</span>}
			{icon}
		</div>
	)
}))

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string
	error: string | undefined
}

const PasswordInput = memo(forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(props, ref){
	const [showIcon, setShowIcon] = useState(Boolean(props.defaultValue || props.value))
	const [showPassword, setShowPassword] = useState(false)
	const [randomPassword, setRandomPassword] = useState("")
	const toggleVisibility = useCallback(() => setShowPassword(!showPassword), [showPassword])
	const forwardedRef = useForwardedRef(ref)

	useEffect(() => setRandomPassword(Math.random().toString(32).substring(2)), [])

	function PasswordIcon(){
		if(!showIcon) return null

		return (
			<span className="icon material-symbols-outlined" onClick={toggleVisibility}>
				{showPassword ? "visibility_off" : "visibility"}
			</span>
		)
	}

	const updateIcon = useCallback((event: SyntheticEvent<HTMLInputElement>) => {
		setShowIcon(Boolean(event.currentTarget.value))
	}, [showIcon])

	return <Input
		type={showPassword ? "text" : "password"}
		placeholder={`Ex: ${randomPassword}`}
		onInput={updateIcon}
		icon={<PasswordIcon />}
		ref={forwardedRef}
		{...props}
	/>
}))

interface OverflowProps {
	config: Config
	data: OverflowData
	isOverflow: boolean
	editUser: (username: string, data: IUpdateUser["data"]) => any
	setData: (state: OverflowData | undefined) => any
	setIsOverflow: (state: boolean) => any
}

const Overflow = memo(function Overflow({ config, data: userData, setData, editUser, isOverflow, setIsOverflow }: OverflowProps){
	const usernameRef = useRef<HTMLInputElement>(null)
	const passwordRef = useRef<HTMLInputElement>(null)
	const accessRef = useRef<HTMLInputElement>(null)
	const submitRef = useRef<HTMLButtonElement>(null)
	const [usernameError, setUsernameError] = useState<string>()
	const [passwordError, setPasswordError] = useState<string>()
	const [accessError, setAccessError] = useState<string>()
	const [fetching, setFetching] = useState(false)

	function EscListener(event: KeyboardEvent){
		if(!isOverflow || event.key !== "Escape" || event.shiftKey || event.ctrlKey) return

		event.preventDefault()
		closeMenu()
	}

	function closeMenu(){
		if(fetching) return

		if(document.body.dataset.overflow){
			delete document.body.dataset.overflow
			document.body.style.removeProperty("overflow")
			window.removeEventListener("keydown", EscListener)
		}

		setData(undefined)
		setIsOverflow(false)
		clearErrors()
	}

	function clearErrors(){
		setUsernameError(undefined)
		setPasswordError(undefined)
		setAccessError(undefined)
	}

	useEffect(() => {
		if(isOverflow && !document.body.dataset.overflow){
			document.body.dataset.overflow = "true"
			document.body.style.setProperty("overflow", "hidden")
			window.addEventListener("keydown", EscListener)
		}
	})

	function EditUser(event: MouseEvent){
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
			const access = accessRef.current.value?.trim() as AccessTypes | "" | undefined

			let errored = false

			if(usernameInput.checkValidity()) setUsernameError(undefined)
			else setUsernameError(username ? "Campo de usuário inválido." : "O campo de usuário não pode estar vazio."), errored = true

			if(passwordInput.checkValidity()) setPasswordError(undefined)
			else setPasswordError(password ? "Campo de senha inválido." : "O campo de senha não pode estar vazio."), errored = true

			if(accessInput.checkValidity()) setAccessError(undefined)
			else{
				if(access){
					accessInput.reportValidity()
					setAccessError(accessInput.validationMessage)
				}else setAccessError("O campo de acesso não pode estar vazio.")

				errored = true
			}

			// Type checking
			if(errored || !access) return

			const userObject: IUpdateUser = {
				username: userData.username,
				data: { username, password, access }
			}

			const conditions = [
				username === userData.username,
				password === userData.password,
				access === userData.access
			] as const

			if(conditions.every(Boolean)){
				toast.error("Nenhuma informação foi alterada")
				return
			}

			if(conditions[0]) delete userObject.data.username
			if(conditions[1]) delete userObject.data.password
			if(conditions[2]) delete userObject.data.access

			return (async function Fetch(){
				setFetching(true)

				try{
					const response = await fetch("/api/user", {
						headers: {
							Accept: "application/json,*/*",
							"Content-Type": "application/json"
						},
						body: JSON.stringify(userObject),
						method: "PUT",
						credentials: "include"
					})

					const data: APIResponse = await response.json()

					if(!data.success) throw data.error

					editUser(userData.username, userObject.data)
					closeMenu()

					toast.success("Usuário editado com sucesso")
				}catch(error: any){
					HandleRequestError(error)
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

	if(!isOverflow) return null

	return (
		<div className={`overflow ${style.overflow}`}>
			<button className="icon close material-symbols-outlined" onClick={closeMenu}>close</button>

			<article className={`content ${style.content}`}>
				<section className="header">
					<h1 className="title">Editar usuário</h1>
				</section>

				<section className={style.form}>
					<Input label="Usuário:"
						name="user"
						type="text"
						className="no-outline"
						defaultValue={userData?.username}
						placeholder="Ex: admin"
						onKeyPress={event => {
							const input = event.target as HTMLInputElement

							if(usernameError && input.value.trim()) setUsernameError(undefined)
							if(event.key === "Enter") event.preventDefault(), passwordRef.current!.focus()
						}}
						error={usernameError}
						ref={usernameRef}
						required
					/>
					<PasswordInput label="Senha:"
						name="password"
						className="no-outline"
						defaultValue={userData?.password}
						autoComplete="new-password"
						onKeyPress={event => {
							const input = event.target as HTMLInputElement

							if(passwordError && input.value.trim()) setPasswordError(undefined)
							if(event.key === "Enter") event.preventDefault(), accessRef.current!.focus()
						}}
						error={passwordError}
						ref={passwordRef}
						required
					/>
					<Input label="Acesso:"
						name="access"
						type="text"
						list="access-types"
						className="no-outline"
						defaultValue={userData?.access}
						pattern={config.accessTypes.join("|")}
						placeholder={`Ex: ${config.accessTypes.slice(0, 3).join(", ")}`}
						onKeyPress={event => {
							const input = event.target as HTMLInputElement
							const value = input.value = input.value.trim()

							if(accessError && value && config.accessTypes.includes(value.toLowerCase() as AccessTypes)){
								setAccessError(undefined)
							}

							if(event.key === "Enter"){
								event.preventDefault()
								submitRef.current!.click()
							}
						}}
						onChange={event => {
							const input = event.target as HTMLInputElement
							const value = input.value = input.value.trim()

							if(accessError && value && config.accessTypes.includes(value.toLowerCase() as AccessTypes)){
								setAccessError(undefined)
							}
						}}
						error={accessError}
						ref={accessRef}
						required
					/>
				</section>

				<section className="submit">
					<button className="no-outline" type="submit" onClick={EditUser} ref={submitRef}>
						{fetching ? <div className="spinner"></div> : "Enviar"}
					</button>
				</section>
			</article>
		</div>
	)
})

export const getServerSideProps: GetServerSideProps<SettingsPageProps> = async ({ req, res }) => {
	try{
		await ConnectDatabase()

		const { token } = req.cookies
		const users = await UserDb.find({}, { _id: 0, __v: 0 }).lean() as IUser[]
		const user = token ? await UserToken.findOne({ token }) : null

		if(user){
			if(user.access !== "all") return {
				redirect: {
					destination: "/?denied",
					permanent: false
				}
			}
		}else{
			if(users.length) return Unauthorize(res)
			else console.log("No users found, access permitted")
		}

		const config = await GetCachedConfig(true)

		return { props: { users, config, userAccess: user?.access || "all" } }
	}catch(error){
		console.error(error)
		return { notFound: true }
	}
}

interface SettingsPageProps {
	users?: IUser[]
	config: Config
	userAccess: AccessTypes
}

interface OverflowData {
	username: string
	password: string
	access: AccessTypes
}

export default function SettingsPage({ config, userAccess, ...props }: SettingsPageProps){
	const [clearErrors, setClearErrors] = useState(() => () => {})
	const [isOverflow, setIsOverflow] = useState(false)
	const [users, setUsers] = useState<Map<string, IUser>>(new Map((props.users || []).map(user => [user.name, user])))
	const [data, setData] = useState<OverflowData | undefined>()

	const addUser = useCallback((user: IUser) => {
		const map = new Map(users)
		map.set(user.name, user)
		setUsers(map)
	}, [users])

	const removeUser = useCallback((username: string) => {
		if(!users.has(username)) console.error(`User not found: ${username}`)

		const map = new Map(users)
		map.delete(username)
		setUsers(map)
	}, [users])

	const editUser = useCallback((username: string, data: IUpdateUser["data"]) => {
		if(!users.has(username)) throw new Error(`User not found: ${username}`)

		const map = new Map(users)
		const user = users.get(username)!

		if(data.username) user.name = data.username
		if(data.password) user.password = data.password
		if(data.access) user.access = data.access

		map.delete(username)
		map.set(user.name, user)

		setUsers(map)
	}, [users])

	return <>
		<Head>
			<title>{`Flash - ${title}`}</title>
			<meta name="description" content={description} />
			<meta property="og:title" content={`Flash - ${title}`} />
			<meta property="og:description" content={description} />
		</Head>

		<Navigation {...{ userAccess }} />

		<main className={style.main}>
			<section className={style.user_management}>
				<header>
					<h2 className={style.title}>
						<span className="icon material-symbols-outlined">manage_accounts</span>
						Gerenciamento de Usuários
					</h2>
				</header>

				<article className={style.users}>
					<AddUser {...{ config, addUser, setClearErrors }} />

					{Array.from(users.values()).map(({ name, password, access }, index) => (
						<User {...{
							username: name,
							password,
							access,
							setData,
							removeUser,
							clearErrors,
							setIsOverflow,
							key: `user-${index}`
						}} />
					))}
				</article>
			</section>
		</main>

		{data && <Overflow {...{ config, data, setData, editUser, isOverflow, setIsOverflow }} />}

		<datalist id="access-types">
			{config.accessTypes.map((type, index) => <option key={`access-type-${index}`} value={type} />)}
		</datalist>
	</>
}
