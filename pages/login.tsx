import type { APILoginResponse } from "../typings/api"
import type { Optional } from "../typings"
import { Component, createRef } from "react"
import { toast } from "react-toastify"
import Image from "next/image"
import style from "../styles/modules/login.module.scss"

interface LoginPageProps {
	fetching: boolean
	showSpinner: boolean
}

export default class LoginPage extends Component<{}, LoginPageProps> {
	state: Readonly<LoginPageProps> = {
		fetching: false,
		showSpinner: false
	}

	ApiErrors = {
		400: "Este formato não é válido.",
		401: "Usuário ou senha estão incorretos.",
		406: "Not Acceptable",
		411: "As informações que você está tentando enviar são muito grande."
	} as const

	addState(entries: Optional<LoginPageProps>): void
	addState<T extends keyof LoginPageProps>(key: T, value: LoginPageProps[T]): void
	addState<T extends keyof LoginPageProps>(arg: T | Optional<LoginPageProps>, value?: LoginPageProps[T]){
		if(typeof arg === "string"){
			return this.setState(prevState => ({ ...prevState, [arg]: value }))
		}

		this.setState(prevState => ({ ...prevState, ...arg }))
	}

	async Submit(username: string, password: string): Promise<APILoginResponse>{
		const SetState = (value: boolean) => this.addState({ fetching: value, showSpinner: value })
		const Enable = () => SetState(true)
		const Disable = () => SetState(false)

		Enable()

		try{
			const response = await fetch("/api/login", {
				headers: {
					"Accept": "text/html,*/*",
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: new URLSearchParams({ username, password }),
				method: "POST"
			})

			if(!response.ok) throw response.status

			let data: APILoginResponse

			try{
				data = await response.json()
			}finally{
				Disable()
			}

			return data
		}finally{
			Disable()
		}
	}

	render(){
		const usernameRef = createRef<HTMLInputElement>()
		const passwordRef = createRef<HTMLInputElement>()

		return (
			<main className={style.main}>
				<section>
					<div className={style.image}>
						<Image src="/images/logo.svg" alt="Logotipo do site" loading="eager" priority={true} fill />
					</div>
					<span>Flash</span>
				</section>
				<section>
					<form method="post" action="/api/login" name="login" onSubmit={async event => {
						event.preventDefault()

						try{
							if(this.state.fetching) throw "Já existe um envio sendo feito"

							const { current: username } = usernameRef
							const { current: password } = passwordRef
							const { success } = await this.Submit(username!.value, password!.value)

							if(!success) throw success

							location.pathname = "/"
						}catch(error){
							switch(typeof error){
								case "string": return toast.error(error)
								case "number":
									if(error in this.ApiErrors) return toast.error(this.ApiErrors[error as keyof typeof this.ApiErrors])
								break
							}

							toast.error("Algo deu errado")
							console.error(error)
						}
					}}>
						<fieldset>
							<label>
								<span>Usuário</span>
								<input type="text" className="no-outline" name="username" ref={usernameRef} />
							</label>
							<label>
								<span>Senha</span>
								<input type="password" className="no-outline" name="password" ref={passwordRef} />
							</label>
						</fieldset>

						<button className={`no-outline ${style.submit}`} type="submit">Entrar</button>
					</form>
				</section>
			</main>
		)
	}
}
