import CreateElement from "../helpers/CreateElement"
import WaitForElement from "../helpers/WaitForElement"

new class Login {
	busy = false
	spinner: HTMLDivElement
	form!: HTMLFormElement
	username!: HTMLInputElement
	password!: HTMLInputElement
	submit!: HTMLButtonElement

	readonly apiErrors = {
		400: "Este formato não é válido.",
		401: "Usuário ou senha estão incorretos.",
		406: "Not Acceptable",
		411: "As informações que você está tentando enviar são muito grande."
	}

	constructor(){
		this.spinner = CreateElement("div", { className: "spinner" })

		this.AddListeners()
	}
	async AddListeners(){
		const form = this.form = await WaitForElement<HTMLFormElement>("main form[name=login]")
		const username = this.username = this.form.querySelector("input[name=username]")!
		const password = this.password = this.form.querySelector("input[name=password]")!

		this.submit = this.form.querySelector(".submit")!
		this.FocusListener()

		form.addEventListener("submit", async event => {
			event.preventDefault()

			try{
				const { success } = await this.Submit(username.value, password.value)

				if(!success) throw success

				location.pathname = "/"
			}catch(error){
				if(typeof error === "number" && error in this.apiErrors){
					return this.DisplayError(this.apiErrors[error])
				}

				this.DisplayError("Algo deu errado")

				console.error(error)
			}
		})
	}
	FocusListener(){
		const { username, password, submit } = this

		username.addEventListener("keypress", function(event){
			if(event.key === "Enter"){
				event.preventDefault()
				password.focus()
			}
		})

		password.addEventListener("keypress", function(event){
			if(event.key === "Enter"){
				event.preventDefault()
				password.blur()
				submit.click()
			}
		})
	}
	async Submit(username: string, password: string){
		if(this.busy) return

		this.busy = true
		this.ShowSpinner()

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

			return await response.json()
		}finally{
			this.busy = false
			this.HideSpinner()
		}
	}
	DisplayError(error: any){
		console.error(error)
	}
	ShowSpinner(){
		const { submit, spinner } = this

		submit.dataset.text = submit.textContent!
		submit.textContent = ""
		submit.appendChild(spinner)
	}
	HideSpinner(){
		const { submit, spinner } = this

		submit.textContent = submit.dataset.text!
		delete submit.dataset.text
		spinner.remove()
	}
}
