#!/usr/bin/env node

import { GetConfig, SetConfig } from "./helpers/Config.js"
import { mkdir, writeFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { createServer } from "http"
import { existsSync } from "fs"
import { Server } from "socket.io"
import mime from "mime"
import express from "express"
import GetNumber from "./helpers/GetNumber.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let config = GetConfig()

const app = express()
const server = createServer(app)
const isDevelopment = process.env.NODE_ENV === "development"
const isWatching = Boolean(process.env.NODEMON)
const mustCache = !isDevelopment
const port = GetNumber(3000, process.env.PORT, config.port)

SetConfig(Object.assign(config, { port }))

if(!isDevelopment) process.env.NODE_ENV = "production"

app.set("view engine", "pug")
app.set("view cache", mustCache)
app.disable("x-powered-by")
app.locals.pretty = true

const rootFolder = join(__dirname, "..")
const documentsFolder = join(rootFolder, "documents")
const buildFolder = join(rootFolder, "build")
const publicFolder = join(rootFolder, "public")
const imagesFolder = join(publicFolder, "images")
const pagesFolder = join(publicFolder, "pages")
const staticFolder = join(publicFolder, "static")

const indexPage = join(pagesFolder, "index.pug")
const documentsPage = join(pagesFolder, "documents.pug")
const loginPage = join(pagesFolder, "login.pug")

/**
 * @param {string} page
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 */
function HandlePugRequests(page, request, response){
	const { protocol, hostname, url } = request

	/** @param {import("express").Request} request */
	const pugOptions = request => ({
		cache: mustCache,
		isWatching,
		canonicalURL: protocol + "://" + hostname + url,
		notifications: {
			unread: false,
			list: []
		}
	})

	response.setHeader("Content-Type", "text/html; charset=utf-8")
	response.setHeader("Cache-Control", isDevelopment ? "private, no-cache" : "private, max-age=10, must-revalidate")
	response.render(page, pugOptions(request))
}

app.use("/", express.static(staticFolder, { index: false }))

app.use("/images", express.static(imagesFolder, {
	acceptRanges: false,
	index: false,
	setHeaders: (response, path) => response.type(mime.getType(path))
}))

app.get(["/", "/index.html"], (request, response) => HandlePugRequests(indexPage, request, response))
app.get("/documents", (request, response) => HandlePugRequests(documentsPage, request, response))
app.get("/login", (request, response) => HandlePugRequests(loginPage, request, response))

const scriptsFolder = join(buildFolder, "scripts")
const stylesFolder = join(buildFolder, "styles")

app.use("/scripts", express.static(scriptsFolder, {
	dotfiles: "deny",
	acceptRanges: false,
	cacheControl: false,
	setHeaders: (response) => {
		response.setHeader("Cache-Control", "private, no-cache")
	}
}))

app.use("/styles", express.static(stylesFolder, {
	dotfiles: "deny",
	acceptRanges: false,
	cacheControl: false,
	setHeaders: (response) => {
		response.setHeader("Cache-Control", "private, no-cache")
	}
}))

app.post("/api/upload", (request, response, next) => {
	const contentType = request.headers["content-type"]

	if(!contentType) return next(400)

	let data = Buffer.alloc(0)

	request.on("data", chunk => data = Buffer.concat([data, Buffer.from(chunk)]))

	request.on("end", async () => {
		const CR = "\r\n"
		const CRLength = CR.length
		const boundary = contentType.split(";")[1].split("=")[1]
		const initialBoundary = `--${boundary}`
		const finalBoundary = `--${boundary}--`
		const endIndex = data.indexOf(finalBoundary)
		const info = /** @type {import("../typings/index.js").UploadInfo} */ ({})

		const { length: boundaryLength } = initialBoundary
		let boundaryIndex = 0

		while(boundaryIndex !== endIndex){
			const nextBoundaryIndex = data.indexOf(initialBoundary, boundaryIndex + 1)
			const headerIndex = boundaryIndex + boundaryLength + CRLength
			const headerEndIndex = data.indexOf(CR.repeat(2), headerIndex)
			const contentIndex = headerEndIndex + CRLength * 2
			const contentEndIndex = nextBoundaryIndex - CRLength
			const headers = data.subarray(headerIndex, headerEndIndex).toString()
			const content = data.subarray(contentIndex, contentEndIndex)

			/** @type {string} */
			let name,
			/** @type {string} */
			filename,
			/** @type {string} */
			type

			for(const line of headers.split("\r\n")){
				const [header, value] = line.split(": ")

				switch(header){
					case "Content-Disposition":
						const values = value.split("; ").slice(1)
						const entries = values.map(disposition => disposition.split("="))

						for(const [key, value] of entries){
							switch(key){
								case "filename":
									filename = JSON.parse(value)
								break
								case "name":
									name = JSON.parse(value)
								break
							}
						}
					break
					case "Content-Type":
						type = value
					break
				}
			}

			switch(name){
				case "file":
					info.file = { filename, type, content }
				break
				case "date":
					info.date = content.toString()
				break
				case "documentType":
					info.documentType = content.toString()
				break
			}

			boundaryIndex = nextBoundaryIndex
		}

		try{
			const { file: { filename, content }, date, documentType } = info

			// TODO!: Create a list of document types in JSON, and verify if it's valid
			// TODO: Organize by sectors
			const folder = join(documentsFolder, documentType)
			const path = join(folder, filename)

			if(!existsSync(folder)) await mkdir(folder, { recursive: true })

			// TODO: Do something with the file date
			await writeFile(path, content)

			response.status(200).send("Upload successful")
		}catch(error){
			console.error(error)
			response.status(500).send("Upload failed")
		}
	})
})

async function WaitBuild(){
	if(!isWatching) return

	/** @param {string} folder */
	function WaitFolder(folder){
		if(existsSync(folder)) return Promise.resolve()

		return new Promise(resolve => {
			const interval = setInterval(() => {
				if(existsSync(folder)){
					clearInterval(interval)
					resolve()
				}
			}, 100)
		})
	}

	await WaitFolder(buildFolder)

	return await Promise.all([
		WaitFolder(scriptsFolder),
		WaitFolder(stylesFolder)
	])
}

WaitBuild().then(() => server.listen(port, () => {
	console.log("Listening in http://localhost:%d", port)

	if(isDevelopment){
		const io = new Server(server)

		app.get("/api/reload", (request, response) => {
			const { ip, query } = request
			const { detail, page } = query

			if(detail === "page" && page){
				console.log(`[${ip}] Asking to reload page '${page}'`)
				const url = page === "index" ? "/" : "/" + page
				io.of(url).emit("browserReload")
			}else{
				console.log(`[${ip}] Asking to reload browsers, detail: ${detail}`)
				io.emit("browserReload")
			}

			response.status(200)
			response.end()
		})
	}
}))
