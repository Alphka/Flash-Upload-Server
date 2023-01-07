import type { FileInfo } from "../typings"
import CreateElement from "../helpers/CreateElement"
import WaitForElement from "../helpers/WaitForElement"

new class Index {
	constructor(){
		this.DocumentsImage()
		this.NotificationHandler()
		this.UploadHandler()
	}
	async DocumentsImage(){
		const { userAgentData } = navigator

		let inserted = false, mobile: boolean

		const main = await WaitForElement("main")

		function InsertImage(){
			if(inserted) return

			if(typeof mobile === "undefined"){
				if(userAgentData){
					mobile = userAgentData.mobile
				}else{
					const userAgent = navigator.userAgent || navigator.appVersion
					mobile = !userAgent.includes("Windows") && /\bMobile\b/i.test(userAgent)
				}
			}

			if(mobile || document.documentElement.clientWidth > 600){
				const image = new Image
				const aside = CreateElement("aside", { children: [image] })

				image.loading = "lazy"
				image.src = "/images/documents.png"
				image.alt = "Ilustração de documentos"

				main.appendChild(aside)

				inserted = true
			}
		}

		InsertImage()

		window.addEventListener("resize", InsertImage)
	}
	async NotificationHandler(){
		const container = await WaitForElement<HTMLDivElement>("#notifications")
		const icon = await WaitForElement<HTMLSpanElement>(".icon", { element: container })
		const content = await WaitForElement<HTMLDivElement>(".content", { element: container })

		icon.addEventListener("click", event => {
			event.preventDefault()
			content.classList.toggle("hidden")
		})
	}
	async UploadHandler(){
		const section = await WaitForElement("main article section:nth-of-type(2)")
		const form: HTMLFormElement = document.forms.namedItem("upload") ?? await WaitForElement("form[name=upload]", { element: section })
		const fileInput = await WaitForElement<HTMLInputElement>("input[type=file]", { element: form })

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

		function CreateInfoMenu(info: FileInfo){
			const GetDate = (date: FileInfo["date"]) => new Date(date).toJSON().slice(0, 10),
			container = CreateElement("div", { id: "info" }),
			nameElements = {
				container: CreateElement("p", {
					children: [
						CreateElement("span", { textContent: "Nome: " })
					],
				}),
				content: CreateElement("span", { textContent: info.name })
			},
			typeElements = {
				container: CreateElement("p", {
					children: [
						CreateElement("span", { textContent: "Tipo de arquivo: " })
					]
				}),
				content: CreateElement("span", {
					className: "mime",
					textContent: info.type
				})
			},
			dateElements = {
				container: CreateElement("p", {
					children: [
						CreateElement("span", { textContent: "Data de criação: " })
					]
				}),
				input: CreateElement("input", {
					type: "date",
					className: "date",
					value: GetDate(info.date)
				})
			},
			documentType = {
				container: CreateElement("p", {
					children: [
						CreateElement("span", { textContent: "Tipo de documento: " })
					]
				}),
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
