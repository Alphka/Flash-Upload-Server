import type { FileInfo } from "../typings"
import CreateElement from "../helpers/CreateElement"
import WaitForElement from "../helpers/WaitForElement"

new class Index {
	nav!: HTMLElement
	main!: HTMLElement

	constructor(){
		WaitForElement("nav").then(nav => {
			this.nav = nav
			this.MobileNavigation()
		})

		WaitForElement("main").then(main => {
			this.main = main
			this.DocumentsImage()
			this.UploadHandler()
			this.NotificationHandler()
		})
	}
	async DocumentsImage(){
		const aside = await WaitForElement("aside", { element: this.main })

		function SetAttribute(set: boolean){
			aside.ariaHidden = set ? "true" : null
		}

		SetAttribute(window.getComputedStyle(aside).display === "none")

		new ResizeObserver(entries => {
			const { contentRect } = entries.find(entry => entry.target === aside)!
			SetAttribute(contentRect.width + contentRect.height === 0)
		}).observe(aside)
	}
	async NotificationHandler(){
		const container = await WaitForElement<HTMLDivElement>("#notifications")
		const icon = container.querySelector(".icon") as HTMLSpanElement
		const content = container.querySelector(".content") as HTMLDivElement

		icon.addEventListener("click", event => {
			event.preventDefault()
			content.classList.toggle("hidden")
		})
	}
	async UploadHandler(){
		const section = await WaitForElement<HTMLElement>("article section:nth-of-type(2)", { element: this.main })
		const form: HTMLFormElement = document.forms.namedItem("upload") || await WaitForElement("form[name=upload]", { element: section })
		const fileLabel = form.querySelector("label") as HTMLLabelElement
		const fileInput = fileLabel.querySelector("input[type=file]") as HTMLInputElement

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
			let nameElements: {
				container: HTMLParagraphElement
				content: HTMLSpanElement
			},
			typeElements: {
				container: HTMLParagraphElement
				content: HTMLSpanElement
			},
			dateElements: {
				container: HTMLParagraphElement
				input: HTMLInputElement
			},
			documentType: {
				container: HTMLParagraphElement
				select: HTMLSelectElement
				options: HTMLOptionElement[]
				defaultOption: HTMLOptionElement
			}, submit: HTMLInputElement

			// Typescript errors...
			nameElements = {} as typeof nameElements
			typeElements = {} as typeof typeElements
			dateElements = {} as typeof dateElements
			documentType = {} as typeof documentType

			function GetDate(date: FileInfo["date"]){
				return new Date(date).toJSON().slice(0, 10)
			}

			function GetType(){
				const { select: { options } } = documentType
				return options[options.selectedIndex]?.textContent
			}

			const container = CreateElement("div", {
				id: "info",
				children: [
					nameElements.container = CreateElement("p", {
						children: [
							CreateElement("span", { textContent: "Nome: " }),
							nameElements.content = CreateElement("span", { textContent: info.name })
						],
					}),
					typeElements.container = CreateElement("p", {
						children: [
							CreateElement("span", { textContent: "Tipo de arquivo: " }),
							typeElements.content = CreateElement("span", {
								className: "mime",
								textContent: info.type
							})
						]
					}),
					dateElements.container = CreateElement("p", {
						children: [
							CreateElement("span", { textContent: "Data de criação: " }),
							dateElements.input = CreateElement("input", {
								type: "date",
								className: "date",
								value: GetDate(info.date)
							})
						]
					}),
					documentType.container = CreateElement("p", {
						children: [
							CreateElement("span", { textContent: "Tipo de documento: " }),
							documentType.select = CreateElement("select", {
								name: "documentType",
								children: [
									documentType.defaultOption = CreateElement("option", {
										textContent: "Selecione um tipo",
										selected: true,
										disabled: true,
										hidden: true
									}),
									...(documentType.options = documentTypes.map((type, index) => CreateElement("option", {
										textContent: type,
										value: index
									})))
								]
							})
						]
					}),
					submit = CreateElement("input", {
						type: "button",
						class: "submit",
						value: "Enviar"
					})
				]
			})

			submit.addEventListener("click", function(event){
				// TODO: Verify data (size and type)
				// TODO*: Display error if file size is too large


				// TODO: Remove this, the element appears when the form is submitted
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

		fileLabel.addEventListener("dragover", event => event.preventDefault())
		fileLabel.addEventListener("dragenter", event => event.preventDefault())

		fileLabel.addEventListener("drop", function(event){
			event.preventDefault()

			const files = event.dataTransfer?.files

			if(files?.length){
				fileInput.files = files
				fileInput.dispatchEvent(new Event("change"))
			}else DisplayError("Nenhum arquivo foi detectado")
		})

		fileInput.addEventListener("change", function(event){
			const file = this.files![0] as File | undefined

			if(!file){
				menu.remove()
				DisplayError("Nenhum arquivo foi selecionado")
				return
			}

			const { name, type, size, lastModified } = file
			const info: FileInfo = { name, type, size, date: lastModified }

			if(menu) menu.SetConfig(info)
			else menu = CreateInfoMenu(info)

			section.appendChild(menu)
		})
	}
	async MobileNavigation(){
		const menu = await WaitForElement(".icons.mobile")
		const openIcon = menu.querySelector(":scope > .icon") as HTMLSpanElement
		const content = menu.querySelector(".content") as HTMLDivElement

		function CloseHandler(event: MouseEvent){
			// event.preventDefault()
			content.classList.add("hidden")
			window.removeEventListener("click", CloseHandler)
		}

		menu.addEventListener("click", function(event){
			event.stopImmediatePropagation()

			if(event.target !== openIcon) return

			if(content.classList.contains("hidden")){
				content.classList.remove("hidden")
				window.addEventListener("click", CloseHandler)
			}else{
				content.classList.add("hidden")
				window.removeEventListener("click", CloseHandler)
			}
		})
	}
}
