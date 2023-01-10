import WaitForElement from "../helpers/WaitForElement"

new class Login {
	form!: HTMLFormElement
	username!: HTMLInputElement
	password!: HTMLInputElement
	submit!: HTMLInputElement

	readonly apiErrors = {
		400: "Este tipo de arquivo não é válido.",
		403: "Há informações faltando.",
		406: "Not Acceptable",
		411: "O arquivo que você está tentando enviar é muito grande."
	}

	constructor(){
		this.AddListeners()
	}
	async AddListeners(){
		const form = this.form = await WaitForElement<HTMLFormElement>("main form[name=login]")
		const username = this.username = this.form.querySelector("input[name=username]")!
		const password = this.password = this.form.querySelector("input[name=password]")!
		const submit = this.submit = this.form.querySelector("input.submit")!

		this.FocusListener()

		form.addEventListener("submit", async event => {
			event.preventDefault()

			try{
				const { success } = await this.Submit(username.value, password.value)

				if(success) location.pathname = "/"
				else console.error("No success from request")
			}catch(error){
				if(typeof error === "number"){
					if(error in this.apiErrors) return this.DisplayError(this.apiErrors[error])
					console.error("Algo deu errado, erro: " + error)
				}

				console.error(error)
			}
		})
	}
	FocusListener(){
		const { form, username, password, submit } = this

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
	}
	DisplayError(error: any){
		console.error(error)
	}
}
