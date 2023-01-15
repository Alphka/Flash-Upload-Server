import type { APIResponse, APIResponseError, APIUploadResponse } from "../../typings/api"
import type { FileElements, FileInfo, FileObject } from "../typings"
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
	progressBar!: ReturnType<typeof this.CreateProgressBar>
	documentTypesPromise: Promise<void>

	files = new Map<string, FileObject>

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
		this.documentTypesPromise = this.SetDocumentTypes()
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

		fileInput.addEventListener("change", async event => {
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

					await this.AddFile(info)
				}
			}catch(error){
				if(typeof error === "string") this.DisplayError(error)
				console.error(error)
			}
		})
	}
	CreateUploadMenu(){
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
			const { key, target, shiftKey, ctrlKey } = event

			if(key !== "Escape") return
			if(shiftKey || ctrlKey) return

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

		let submitBusy = false

		const Close = () => {
			if(submitBusy) return

			window.removeEventListener("keydown", EscListener)
			trap.deactivate()
			container.remove()
			document.body.style.removeProperty("overflow")
			document.body.focus()

			for(const filename of this.files.keys()){
				this.DeleteFile(filename)
			}
		}

		const Append = () => {
			document.body.style.setProperty("overflow", "hidden")
			document.body.appendChild(container)
			window.addEventListener("keydown", EscListener)
			trap.activate()
		}

		closeButton.addEventListener("click", () => Close())

		submitButton.addEventListener("click", async () => {
			if(submitBusy) return

			submitBusy = true

			const gmt = new Date().toTimeString().match(/GMT[-+]\d{4}/)![0]
			const formData = new FormData()

			for(const file of this.files.values()){
				const { elements, info } = file
				const { dateInput, typeSelect, checkboxInput, error } = elements
				const { name, file: fileBlob } = info

				formData.append("date", new Date(`${dateInput.value} ${gmt}`).toISOString())
				formData.append("type", typeSelect.value)
				formData.append("isPrivate", String(checkboxInput.checked))
				formData.append("image", fileBlob, name)

				if(error){
					error.remove()
					delete elements.error
				}
			}

			try{
				this.progressBar ??= this.CreateProgressBar()
				this.progressBar.Append()

				const response = await axios.post<APIUploadResponse>("/api/upload", formData, {
					headers: {
						"Content-Type": "multipart/form-data"
					},
					withCredentials: true,
					onUploadProgress: progressEvent => {
						const progress = progressEvent.progress ? progressEvent.progress * 100 : (progressEvent.loaded * 100 / progressEvent.total!)
						this.progressBar.UpdatePercentage(progress)
					}
				})

				// Type assertion
				if(!response.data.success) throw "Upload failed"

				// Handle each error
				for(const { filename, message } of response.data.errors){

					if(!filename){
						console.error("API Error:", message)
						continue
					}

					const file = this.files.get(filename)
					const container = file?.elements.container

					if(file && container){
						let { error } = file.elements

						if(error) error.textContent = message
						else error = file.elements.error = CreateElement("p", {
							className: "error",
							textContent: message
						})

						container.appendChild(error)
					}else this.DisplayError(`O arquivo '${filename}' não pôde ser enviado`)
				}

				// Remove uploaded files
				for(const filename of response.data.uploaded){
					const file = this.files.get(filename)

					if(!file) continue

					const { container, error } = file.elements

					if(error){
						error.remove()
						delete file.elements.error
					}

					container.classList.add("success")

					setTimeout(() => {
						container.classList.add("hidden")

						container.addEventListener("transitionend", () => {
							this.DeleteFile(filename, true)
						})
					}, 3000)
				}
			}catch(error){
				this.HandleRequestError(error)
			}finally{
				submitBusy = false
				this.progressBar.Remove()
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
			Close
		}
	}
	async AddFile(info: FileInfo){
		if(!this.documentTypes){
			try{
				await this.documentTypesPromise
			}catch(error){
				console.error(error)
				throw "Não foi possível criar o menu para o envio dos arquivos"
			}
		}

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
				elements.dateInput = CreateElement("input", { type: "date", value: this.GetInputDate(info.date) })
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

		const { files, uploadMenu: { filesContainer } } = this

		deleteButton.addEventListener("click", () => {
			this.DeleteFile(info.name, true)
		})

		files.set(info.name, { info, elements })
		filesContainer.appendChild(container)

		return elements
	}
	DeleteFile(filename: string, close = false){
		const { files } = this
		const file = files.get(filename)

		if(file){
			file.elements.container.remove()
			files.delete(filename)
		}

		if(close && !files.size) this.uploadMenu.Close()
	}
	CreateProgressBar(){
		const { submitContainer } = this.uploadMenu
		const container = CreateElement("div", { className: "progress" })
		const bar = CreateElement("div", { className: "bar" })
		const percentage = CreateElement("span", { className: "percentage" })

		function UpdatePercentage(value: number){
			const text = Math.trunc(value) + "%"

			bar.style.setProperty("--width", text)
			percentage.textContent = text
		}

		function Append(){
			submitContainer.appendChild(container)
		}

		function Remove(){
			container.remove()
			UpdatePercentage(0)
		}

		UpdatePercentage(0)

		container.appendChild(bar)
		container.appendChild(percentage)

		return { container, UpdatePercentage, Remove, Append }
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
