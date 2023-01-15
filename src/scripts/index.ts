import type { APIResponse, APIResponseError } from "../../typings/api"
import type { FileElements, FileInfo } from "../typings"
import type { DocumentTypeInfo } from "../../typings/database"
import CreateElement from "../helpers/CreateElement"
import WaitForElement from "../helpers/WaitForElement"
import * as focusTrap from "focus-trap"
import axios, { type AxiosError } from "axios"

new class Index {
	nav!: HTMLElement
	main!: HTMLElement
	documentTypes!: DocumentTypeInfo[]
	uploadMenu: ReturnType<typeof this.CreateUploadMenu>

	constructor(){
		WaitForElement("nav").then(nav => {
			this.nav = nav
			this.MobileNavigation()
		})

		WaitForElement("main").then(main => {
			this.main = main
			this.DocumentsImage()
			this.NotificationHandler()

			WaitForElement<HTMLElement>("article section:nth-of-type(2)", { element: main }).then(section => {
				this.UploadHandler(section)
			})
		})

		this.uploadMenu = this.CreateUploadMenu()
		this.SetDocumentTypes()
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
	async UploadHandler(section: HTMLElement){
		const form: HTMLFormElement = document.forms.namedItem("upload") || await WaitForElement("form[name=upload]", { element: section })
		const fileLabel = form.querySelector("label") as HTMLLabelElement
		const fileInput = fileLabel.querySelector("input[type=file]") as HTMLInputElement

		fileLabel.addEventListener("dragover", event => event.preventDefault())
		fileLabel.addEventListener("dragenter", event => event.preventDefault())

		fileLabel.addEventListener("drop", event => {
			event.preventDefault()

			const files = event.dataTransfer?.files

			if(files?.length){
				fileInput.files = files
				fileInput.dispatchEvent(new Event("change"))
			}else this.DisplayError("Nenhum arquivo foi detectado")
		})

		fileLabel.addEventListener("keypress", event => {
			if(event.key === "Enter"){
				event.preventDefault()
				fileInput.click()
			}
		})

		fileInput.addEventListener("change", event => {
			const files = fileInput.files!

			if(!files.length){
				this.uploadMenu.Close()
				this.DisplayError("Nenhum arquivo foi selecionado")
				return
			}

			try{
				this.uploadMenu.Append()

				for(const file of files){
					const { name, type, size, lastModified } = file
					const info: FileInfo = { name, type, size, date: lastModified, file }

					this.uploadMenu.AddFile(info)
				}
			}catch(error){
				if(typeof error === "string") this.DisplayError(error)
				console.error(error)
			}
		})
	}
	CreateUploadMenu(){
		const { GetInputDate } = this

		const files = new Array<{ info: FileInfo, elements: FileElements }>

		let closeButton: HTMLInputElement,
		article: HTMLElement,
		header: HTMLElement,
		title: HTMLHeadingElement,
		filesContainer: HTMLElement,
		submitContainer: HTMLElement,
		submitButton: HTMLInputElement

		const container = CreateElement("div", {
			className: "overflow",
			children: [
				closeButton = CreateElement("input", {
					type: "button",
					className: "close",
					value: "\u00d7"
				}),
				article = CreateElement("article", {
					children: [
						header = CreateElement("section", {
							className: "header",
							children: [
								title = CreateElement("h1", {
									className: "title",
									textContent: "Enviar arquivos"
								})
							]
						}),
						filesContainer = CreateElement("section", {
							className: "files"
						}),
						submitContainer = CreateElement("section", {
							className: "submit",
							children: [
								submitButton = CreateElement("input", {
									type: "button",
									value: "Enviar"
								})
							]
						})
					]
				})
			]
		})

		const trap = focusTrap.createFocusTrap(container, {
			escapeDeactivates: false,
			returnFocusOnDeactivate: false
		})

		function EscListener(event: KeyboardEvent){
			const { key, target } = event

			if(key !== "Escape") return

			switch((target as HTMLElement)?.tagName){
				case "input":
				case "select":
				case "button":
					return
			}

			Close()
			event.preventDefault()
			event.stopPropagation()
			window.removeEventListener("keydown", EscListener)
		}

		function Append(){
			document.body.appendChild(container)
			window.addEventListener("keydown", EscListener)
			trap.activate()
		}

		function Close(){
			trap.deactivate()
			window.removeEventListener("keydown", EscListener)
			container.remove()
			window.focus()

			for(const file of [...files].reverse()){
				DeleteFile(file)
			}
		}

		const AddFile = (info: FileInfo) => {
			if(!this.documentTypes) throw "Não foi possível criar o menu para o envio dos arquivos"

			const elements = {} as FileElements

			const deleteButton = CreateElement("button", {
				className: "icon delete material-symbols-outlined",
				textContent: "delete"
			})

			const name = elements.name = CreateElement("p", {
				className: "name",
				children: [
					elements.nameLabel = CreateElement("span", { class: "label", textContent: "Nome" }),
					elements.nameContent = CreateElement("span", { class: "content", textContent: info.name })
				]
			})

			const mime = elements.mime = CreateElement("p", {
				className: "mime",
				children: [
					elements.mimeLabel = CreateElement("span", { class: "label", textContent: "Tipo de arquivo" }),
					elements.mimeContent = CreateElement("span", { class: "content", textContent: info.type })
				]
			})

			const date = elements.date = CreateElement("p", {
				className: "date",
				children: [
					elements.dateLabel = CreateElement("span", { class: "label", textContent: "Data de criação" }),
					elements.dateInput = CreateElement("input", { type: "date", value: GetInputDate(info.date) })
				]
			})

			const type = elements.type = CreateElement("p", {
				className: "type",
				children: [
					elements.typeLabel = CreateElement("span", { class: "label", textContent: "Tipo de documento" }),
					elements.typeSelect = CreateElement("select", {
						class: "content",
						children: [
							elements.defaultOption = CreateElement("option", {
								selected: true,
								disabled: true,
								hidden: true,
								textContent: "Selecione um tipo"
							})
						]
					})
				]
			})

			this.documentTypes.forEach(({ id, name }) => {
				const option = CreateElement("option", {
					value: id,
					textContent: name
				})

				elements.typeSelect.appendChild(option)
			})

			const checkbox = elements.checkbox = CreateElement("p", {
				className: "checkbox",
				children: [
					CreateElement("label", {
						children: [
							elements.checkboxInput = CreateElement("input", { type: "checkbox" }),
							elements.checkboxLabel = CreateElement("span", { className: "label", textContent: "Arquivo privado" })
						]
					})
				]
			})

			const container = elements.container = CreateElement("section", {
				className: "file",
				children: [deleteButton, name, mime, date, type, checkbox]
			})

			const file = { info, elements }

			deleteButton.addEventListener("click", () => DeleteFile(file, true))

			files.push(file)
			filesContainer.appendChild(container)

			return elements
		}

		function DeleteFile(file: typeof files[number], close = false){
			file.elements.container.remove()
			files.splice(files.indexOf(file), 1)

			if(close && !files.length) Close()
		}

		closeButton.addEventListener("click", () => Close())

		let busy = false

		submitButton.addEventListener("click", async () => {
			if(busy) return

			busy = true

			const formData = new FormData()

			for(const { info: { name, file }, elements: { dateInput, typeSelect, checkboxInput } } of files){
				formData.append("date", new Date(`${dateInput.value} GMT-0300`).toISOString())
				formData.append("type", typeSelect.value)
				formData.append("isPrivate", String(checkboxInput.checked))
				formData.append("image", file, name)
			}

			try{
				await axios.post("/api/upload", formData, {
					headers: {
						"Content-Type": "multipart/form-data"
					},
					withCredentials: true
				})
			}catch(error){
				this.HandleRequestError(error)
			}finally{
				busy = false
			}
		})

		return {
			container,
			closeButton,
			article,
			header,
			title,
			filesContainer,
			submitContainer,
			submitButton,
			Append,
			Close,
			AddFile
		}
	}
	GetInputDate(date: string | number | Date){
		return new Date(date).toJSON().slice(0, 10)
	}
	async SetDocumentTypes(){
		async function Request(){
			const response = await axios.get<APIResponse<DocumentTypeInfo[]>>("/api/config/types", {
				headers: { "Accept": "application/json" },
				withCredentials: true,
				responseType: "json"
			})

			if(response.data.success){
				const { data } = response.data
				return data!
			}else throw false
		}

		for(let times = 0; !this.documentTypes; times++){
			try{
				const types = await Request()
				this.documentTypes = types
			}catch(error){
				// If Response.success is false
				if(error === false){
					if(times === 3){
						this.HandleRequestError("Não foi possível definir os tipos de documentos")
						break
					}

					continue
				}

				this.HandleRequestError(error)
			}
		}
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
	HandleRequestError(error: any){
		if(error.isAxiosError){
			const { message, response } = error as AxiosError<APIResponseError>
			if(response) this.DisplayError(response.data.error!)
			return console.error(message)
		}

		console.error(error)
	}
	DisplayError(error: string){
		console.error(error)
	}
}
