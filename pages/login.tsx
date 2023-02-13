import type { GetServerSideProps } from "next"
import { memo, useRef, useState, type RefObject } from "react"
import { toast } from "react-toastify"
import ConnectDatabase from "../lib/ConnectDatabase"
import UserToken from "../models/UserToken"
import Router from "next/router"
import Image from "next/image"
import style from "../styles/modules/login.module.scss"
import Head from "next/head"

const title = "Login"
const description = "Entre para obter acesso aos documentos do Flash."

const Logo = memo(function Logo(){
	return <>
		<div className={style.image}>
			<Image src="/images/logo.svg" alt="Logotipo do site" loading="eager" priority={true} fill />
		</div>
		<span>Flash</span>
	</>
})

const LoginForm = memo(function Form(){
	const usernameRef = useRef<HTMLInputElement>(null)
	const passwordRef = useRef<HTMLInputElement>(null)
	const submitRef = useRef<HTMLButtonElement>(null)
	const [fetching, setFetching] = useState(false)

	return (
		<form method="post" action="/api/login" name="login" onSubmit={async event => {
			event.preventDefault()

			try{
				if(fetching) throw "Por favor, aguarde."

				const GetValue = <T extends HTMLInputElement>(ref: RefObject<T>) => ref.current?.value.trim()
				const username = GetValue(usernameRef), password = GetValue(passwordRef)

				if(!username) throw "Usuário inválido"
				if(!password) throw "Senha inválida"

				setFetching(true)

				try{
					const response = await fetch("/api/login", {
						headers: {
							"Accept": "text/html,*/*",
							"Content-Type": "application/x-www-form-urlencoded"
						},
						body: new URLSearchParams({ username, password }),
						method: "POST"
					})

					const data = await response.json()

					if(!data.success) throw data.error ?? data.success

					Router.push("/")
				}finally{
					setFetching(false)
				}
			}catch(error){
				if(typeof error === "string") return toast.error(error)

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
				{fetching ? <div className={style.spinner}></div> : "Entrar"}
			</button>
		</form>
	)
})

export default function LoginPage(){
	return <>
		<Head>
			<title>Flash - {title}</title>
			<meta name="description" content={description} />
			<meta property="og:title" content={`Flash - ${title}`} />
			<meta property="og:description" content={description} />
		</Head>

		<main className={style.main}>
			<section>
				<Logo />
			</section>
			<section>
				<LoginForm />
			</section>
		</main>
	</>
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	await ConnectDatabase()

	const { token } = req.cookies

	if(token){
		const user = await UserToken.findOne({ token })
		user?.delete()
		res.setHeader("set-cookie", "token=; Max-Age=0; Path=/; SameSite=Strict; Secure; HttpOnly")
	}

	return { props: {} }
}
