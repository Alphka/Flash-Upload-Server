import { memo, useRef, useState } from "react"
import { toast } from "react-toastify"
import Router from "next/router"
import Image from "next/image"
import style from "../styles/modules/login.module.scss"

const ApiErrors = {
	400: "Este formato não é válido.",
	401: "Usuário ou senha estão incorretos.",
	406: "Not Acceptable",
	411: "As informações que você está tentando enviar são muito grande."
} as const

const Logo = memo(function Logo(){
	return <>
		<div className={style.image}>
			<Image src="/images/logo.svg" alt="Logotipo do site" loading="eager" priority={true} fill />
		</div>
		<span>Flash</span>
	</>
})

export default function LoginPage(){
	const usernameRef = useRef<HTMLInputElement>(null)
	const passwordRef = useRef<HTMLInputElement>(null)
	const submitRef = useRef<HTMLButtonElement>(null)
	const [fetching, setFetching] = useState(false)
	const [spinner, setSpinner] = useState(false)

	return (
		<main className={style.main}>
			<section>
				<Logo />
			</section>
			<section>
				<form method="post" action="/api/login" name="login" onSubmit={async event => {
					event.preventDefault()

					try{
						if(fetching) throw "Já existe um envio sendo feito"

						setFetching(true)
						setSpinner(true)

						try{
							const response = await fetch("/api/login", {
								headers: {
									"Accept": "text/html,*/*",
									"Content-Type": "application/x-www-form-urlencoded"
								},
								body: new URLSearchParams({
									username: usernameRef.current!.value,
									password: passwordRef.current!.value
								}),
								method: "POST"
							})

							if(!response.ok) throw response.status

							const data = await response.json()

							if(!data.success) throw data.error ?? data.success

							Router.push("/")
						}finally{
							setFetching(false)
							setSpinner(false)
						}
					}catch(error){
						switch(typeof error){
							case "string": return toast.error(error)
							case "number":
								if(error in ApiErrors) return toast.error(ApiErrors[error as keyof typeof ApiErrors])
							break
						}

						toast.error("Algo deu errado")
						console.error(error)
					}
				}}>
					<fieldset>
						<label>
							<span>Usuário</span>
							<input type="text" className="no-outline" name="username" ref={usernameRef} onKeyPress={event => {
								if(event.key === "Enter"){
									event.preventDefault()
									passwordRef.current!.focus()
								}
							}} />
						</label>
						<label>
							<span>Senha</span>
							<input type="password" className="no-outline" name="password" ref={passwordRef} onKeyPress={event => {
								if(event.key === "Enter"){
									event.preventDefault()
									submitRef.current!.click()
								}
							}} />
						</label>
					</fieldset>

					<button className={`no-outline ${style.submit}`} type="submit" ref={submitRef}>
						{spinner ? <div className={style.spinner}></div> : "Entrar"}
					</button>
				</form>
			</section>
		</main>
	)
}
