import CreateElement from "../helpers/CreateElement"

new class Index {
	constructor(){
		this.NotificationHandler()
		this.UploadHandler()
	}
	NotificationHandler(){
		const container = document.getElementById("notifications") as HTMLDivElement
		const icon = container.getElementsByClassName("icon")[0] as HTMLSpanElement
		const content = container.getElementsByClassName("content")[0] as HTMLDivElement

		icon.addEventListener("click", event => {
			event.preventDefault()
			content.classList.toggle("hidden")
		})
	}
	UploadHandler(){
		const section = document.querySelector("main article section:nth-of-type(2)")!
		const form = document.forms.namedItem("upload") as HTMLFormElement
		const fileInput = form.querySelector("input[type=file]") as HTMLInputElement

		const documentTypes = [
			"Ata",
			"Procedimento Operacional Padrão",
			"Inventário",
			"Ordem de Serviço",
			"Nota Fiscal"
		] as const

		let menu: ReturnType<typeof CreateInfoMenu>

		function DisplayError(error: string){
			console.error(error)
		}

		interface FileInfo {
			name: string
			type: string
			size: number
			date: number
		}

		function CreateInfoMenu(info: FileInfo){
			const GetDate = (date: FileInfo["date"]) => new Date(date).toJSON().slice(0, 10),
			container = CreateElement("div", { id: "info" }),
			nameElements = {
				container: CreateElement("p", { textContent: "Nome: " }),
				content: CreateElement("span", { textContent: info.name })
			},
			typeElements = {
				container: CreateElement("p", { textContent: "Tipo de arquivo: " }),
				content: CreateElement("span", {
					className: "mime",
					textContent: info.type
				})
			},
			dateElements = {
				container: CreateElement("p", { textContent: "Data de criação: " }),
				input: CreateElement("input", {
					type: "date",
					value: GetDate(info.date)
				})
			},
			documentType = {
				container: CreateElement("p", { textContent: "Tipo de documento: " }),
				select: CreateElement("select", { name: "documentType" }),
				options: documentTypes.map((type, index) => CreateElement("option", {
					textContent: type,
					value: index
				})),
				defaultOption: CreateElement("option", {
					textContent: "Selecione um tipo",
					selected: true,
					disabled: true,
					hidden: true
				})
			},
			submit = CreateElement("input", {
				type: "button",
				class: "submit",
				value: "Enviar"
			}),
			GetType = () => documentType.select.options[documentType.select.options.selectedIndex]?.textContent

			nameElements.container.appendChild(nameElements.content)
			typeElements.container.appendChild(typeElements.content)
			dateElements.container.appendChild(dateElements.input)
			documentType.select.options.add(documentType.defaultOption)
			documentType.container.appendChild(documentType.select)

			documentType.options.forEach(option => documentType.select.options.add(option))

			container.appendChild(nameElements.container)
			container.appendChild(typeElements.container)
			container.appendChild(dateElements.container)
			container.appendChild(documentType.container)
			container.appendChild(submit)

			submit.addEventListener("click", function(event){
				// TODO: Verify data (size and type)
				// TODO*: Display error if file size is too large

				// TODO!: Upload file to server
				form.appendChild(CreateElement("input", { name: "date", value: new Date(info.date).toJSON() }))
				form.appendChild(CreateElement("input", { name: "documentType", value: GetType() }))
				form.submit()

				// TODO: Display error if upload fails
				// TODO*: Show progress of the upload

				console.log("File sent", {
					name: info.name,
					type: info.type,
					date: info.date,
					size: info.size,
					documentType: GetType()
				})
			})

			function SetConfig(info: FileInfo): void
			function SetConfig(){
				// Overriding variables for the submit handler
				const { name, type, size, date } = info = arguments[0]

				nameElements.content.textContent = name
				typeElements.content.textContent = type
				dateElements.input.value = GetDate(date)
			}

			return Object.defineProperty(container, "SetConfig", { value: SetConfig }) as typeof container & { SetConfig: typeof SetConfig }
		}

		fileInput.addEventListener("change", function(event){
			const file = this.files![0] as File | undefined

			if(!file){
				menu.remove()
				DisplayError("No files selected")
				return
			}

			const { name, type, size, lastModified } = file
			const info: FileInfo = { name, type, size, date: lastModified }

			if(menu) menu.SetConfig(info)
			else menu = CreateInfoMenu(info)

			section.appendChild(menu)
		})
	}
}
