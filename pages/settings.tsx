import type { InputHTMLAttributes, CSSProperties, MouseEvent, KeyboardEvent, RefObject } from "react"
import type { Config, LoginAccess } from "../typings/database"
import type { AccessTypes, IUser } from "../models/typings"
import type { GetServerSideProps } from "next"
import type { APIResponse } from "../typings/api"
import { memo, forwardRef, useRef, useState, useCallback, useEffect } from "react"
import { GetCachedConfig } from "../helpers/Config"
import { toast } from "react-toastify"
import useForwardedRef from "../helpers/useForwardedRef"
import ConnectDatabase from "../lib/ConnectDatabase"
import Unauthorize from "../helpers/Unauthorize"
import Navigation from "../components/Navigation"
import UserToken from "../models/UserToken"
import style from "../styles/modules/settings.module.scss"
import Head from "next/head"
import User from "../models/User"

const title = "Configurações"
const description = "Página de configuração do site."

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string
	error: string | undefined
	icon?: JSX.Element | null
}
interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string
	error: string | undefined
}

interface SettingsPageProps {
	users?: IUser[]
	config: Config
	userAccess: AccessTypes
}

interface UserProps {
	username: string
	password: string
	access: string
	removeUser: (username: string) => any
}

interface AddUserProps {
	config: Config
	addUser: (user: IUser) => any
}

function ClickInput<T extends HTMLElement, E extends HTMLElement>(input: RefObject<T>){
	return (event: KeyboardEvent<E>) => {
		if(event.key === "Enter") input.current!.click()
	}
}

const UserComponent = memo(function User({ username, password, access, removeUser }: UserProps){
	return (
		<div className={style.user}>
			<div className={style.header}>
				<span className="icon material-symbols-outlined">person</span>
				<span className={style.username}>{username}</span>
				<span className={`icon ${style.remove} material-symbols-outlined`} title="Remover usuário" onClick={async event =>{
					event.preventDefault()

					const response = await fetch("/api/user", {
						body: new URLSearchParams({ username }),
						method: "DELETE",
						credentials: "include"
					})

					const data = await response.json() as APIResponse

					if(data.success){
						const { message } = data

						removeUser(username)
						toast.success("Usuário removido com sucesso")

						if(message) toast.error(message)
					}else toast.error(data.error)
				}}>close</span>
			</div>

			<div className={style.controls}>
				<div>
					<span className={style.label}>
						Senha: <span style={{ cursor: "pointer" }} className={style.password}
							onMouseDown={event => {
								if(event.detail > 1) event.preventDefault()
							}}
							onClick={event => {
								event.currentTarget.classList.toggle(style.password)
							}}
						>{password}</span>
					</span>
					<input type="button" value="Alterar senha" style={{ "--color": "#29299d" } as CSSProperties} />
				</div>
				<div>
					<span className={style.label}>Acesso: {access}</span>
					<input type="button" value="Alterar acesso" style={{ "--color": "#005aff" } as CSSProperties} />
				</div>
			</div>
		</div>
	)
})

const AddUser = memo(function AddUser({ config, addUser }: AddUserProps){
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

			return (async function Fetch(){
				setFetching(true)

				try{
					const response = await fetch("/api/user", {
						body: new URLSearchParams({ username, password, access }),
						method: "POST",
						credentials: "include"
					})

					const data: APIResponse = await response.json()

					if(data.success){
						addUser({ name: username, password, access })
						toast.success("Usuário criado com sucesso")
						usernameRef.current!.value = passwordRef.current!.value = accessRef.current!.value = ""
					}else toast.error(data.error)
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
					required: true,
					autoComplete: "username",
					placeholder: "Ex: admin",
					className: "no-outline",
					ref: usernameRef,
					onKeyPress: event => {
						const input = event.target as HTMLInputElement
						if(event.key === "Enter") event.preventDefault(), passwordRef.current!.focus()
						if(usernameError && input.value) setUsernameError(undefined)
					},
					error: usernameError
				}} />

				<PasswordInput {...{
					label: "Senha:",
					autoComplete: "new-password",
					required: true,
					className: "no-outline",
					onKeyPress: event => {
						const input = event.target as HTMLInputElement
						if(event.key === "Enter") event.preventDefault(), accessRef.current!.focus()
						if(passwordError && input.value) setUsernameError(undefined)
					},
					error: passwordError,
					ref: passwordRef
				}} />

				<Input {...{
					label: "Acesso:",
					className: "no-outline",
					pattern: config.accessTypes.join("|"),
					placeholder: `Ex: ${config.accessTypes.slice(0, 3).join(", ")}`,
					title: `Tipo de acesso (${config.accessTypes.join(", ")})`,
					list: "access-types",
					required: true,
					ref: accessRef,
					onKeyPress: event => {
						const input = event.target as HTMLInputElement
						if(event.key === "Enter") event.preventDefault(), submitRef.current!.click()
						if(accessError){
							input.value = input.value.trim()
							if(input.value && config.accessTypes.includes(input.value.toLowerCase() as LoginAccess)) setUsernameError(undefined)
						}
					},
					error: accessError
				}} />

				<datalist id="access-types">
					{config.accessTypes.map((type, index) => (
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
})

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
			<span className={style.label}>{label}</span>
			<input {...props} />
			{error && <span className={style.error}>{error}</span>}
			{icon}
		</div>
	)
}))

const PasswordInput = memo(forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(props, ref){
	const [showPassword, setShowPassword] = useState(false)
	const [randomPassword, setRandomPassword] = useState("")
	const toggleVisibility = useCallback(() => setShowPassword(!showPassword), [showPassword])
	const forwardedRef = useForwardedRef(ref)

	useEffect(() => setRandomPassword(Math.random().toString(32).substring(2)), [])

	function PasswordIcon(){
		return (
			<span className="icon material-symbols-outlined" onClick={toggleVisibility}>
				{showPassword ? "visibility_off" : "visibility"}
			</span>
		)
	}

	return <Input {...{
		...props,
		ref: forwardedRef,
		type: showPassword ? "text" : "password",
		placeholder: `Ex: ${randomPassword}`,
		icon: forwardedRef.current?.value ? <PasswordIcon /> : null
	}} />
}))

export const getServerSideProps: GetServerSideProps<SettingsPageProps> = async ({ req, res }) => {
	try{
		await ConnectDatabase()

		const { token } = req.cookies
		const users = await User.find({}, { _id: 0, __v: 0 }).lean() as IUser[]
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

export default function SettingsPage({ config, userAccess, ...props }: SettingsPageProps){
	const [users, setUsers] = useState<Map<string, IUser>>(new Map((props.users || []).map(user => [user.name, user])))

	delete props.users

	const addUser = useCallback((user: IUser) => {
		const map = new Map(users)
		map.set(user.name, user)
		setUsers(map)
	}, [users])

	const removeUser = useCallback((username: string) => {
		const map = new Map(users)
		map.delete(username)
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
					<h2 className={style.title}><span className="icon material-symbols-outlined">manage_accounts</span>Gerenciamento de Usuários</h2>
				</header>

				<article className={style.users}>
					<AddUser {...{ config, addUser }} />

					{Array.from(users.values()).map(({ name, password, access }, index) => (
						<UserComponent {...{
							username: name,
							password,
							access,
							removeUser
						}} key={`user-${index}`} />
					))}
				</article>
			</section>
		</main>
	</>
}
