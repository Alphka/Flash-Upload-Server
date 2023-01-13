import type { FileElements, FileInfo } from "../typings"
import CreateElement from "../helpers/CreateElement"
import WaitForElement from "../helpers/WaitForElement"
import * as focusTrap from "focus-trap"
import axios from "axios"

new class Index {
	nav!: HTMLElement
	main!: HTMLElement
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
		const fileLabel = form.querySelector("label:has(input[type=file])") as HTMLLabelElement
		const fileInput = fileLabel.querySelector("input")!

		const documentTypes = [
			"Ata",
			"Procedimento Operacional Padrão",
			"Inventário",
			"Ordem de Serviço",
			"Nota Fiscal"
		] as const

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

			this.uploadMenu.Append()

			for(const file of files){
				const { name, type, size, lastModified } = file
				const info: FileInfo = { name, type, size, date: lastModified, file }

				this.uploadMenu.AddFile(info)
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

		const trap = focusTrap.createFocusTrap(container)

		function ESCListener(event: KeyboardEvent){
			const { key, target } = event

			if(
				key !== "Esc" ||
				target instanceof HTMLInputElement ||
				target instanceof HTMLSelectElement ||
				target instanceof HTMLButtonElement
			) return

			Close()
			event.preventDefault()
			window.removeEventListener("keypress", ESCListener)
		}

		function Append(){
			document.body.appendChild(container)
			window.addEventListener("keypress", ESCListener)
			trap.activate()
		}

		function Close(){
			trap.deactivate()
			window.removeEventListener("keypress", ESCListener)
			container.remove()

			for(const file of files){
				DeleteFile(file)
			}

			files.splice(0, files.length)
		}

		function AddFile(info: FileInfo){
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

			// ! TODO: Add options to select (transfer the document types to the database)

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

			deleteButton.addEventListener("click", () => DeleteFile(file))

			files.push(file)
			filesContainer.appendChild(container)

			return elements
		}

		function DeleteFile(file: typeof files[number]){
			file.elements.container.remove()
			files.splice(files.indexOf(file), 1)

			if(!files.length) Close()
		}

		closeButton.addEventListener("click", () => Close())

		let busy = false

		submitButton.addEventListener("click", async () => {
			if(busy) return

			busy = true

			const formData = new FormData()

			for(const { info: { name, file }, elements: { dateInput, typeSelect, checkboxInput } } of files){
				formData.append("image", file, name)
				formData.append("date", new Date(`${dateInput.value} GMT-0300`).toISOString())
				formData.append("type", typeSelect.value)
				formData.append("isPrivate", String(checkboxInput.checked))
			}

			try{
				await axios.post("/api/upload", formData, {
					headers: {
						"Content-Type": "multipart/form-data"
					},
					withCredentials: true
				})
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
	DisplayError(error: string){
		console.error(error)
	}
}
