#!/usr/bin/env node

import { GetConfig, SetConfig } from "./helpers/Config.js"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { createServer } from "http"
import { existsSync } from "fs"
import { Server } from "socket.io"
import mime from "mime"
import express from "express"
import GetNumber from "./helpers/GetNumber.js"
import ApiRouter from "./controllers/api/index.js"

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

app.set("port", port)
app.set("watch", isWatching)
app.set("development", isDevelopment)
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
const scriptsFolder = join(buildFolder, "scripts")
const stylesFolder = join(buildFolder, "styles")

const indexPage = join(pagesFolder, "index.pug")
const documentsPage = join(pagesFolder, "documents.pug")
const loginPage = join(pagesFolder, "login.pug")

app.set("rootFolder", rootFolder)
app.set("documentsFolder", documentsFolder)
app.set("pagesFolder", pagesFolder)

const staticCache = isDevelopment ? "public, no-cache" : "public, max-age=3600, must-revalidate"
const imageCache = staticCache + ", no-transform"
const pageCache = "private, " + (isDevelopment ? "no-cache" : "max-age=10, must-revalidate")

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
	response.setHeader("Cache-Control", pageCache)
	response.render(page, pugOptions(request))
}

app.use("/", express.static(staticFolder, {
	cacheControl: false,
	index: false,
	setHeaders: (response, path) => {
		response.setHeader("Cache-Control", staticCache)
		response.type(mime.getType(path))
	}
}))

app.use("/images", express.static(imagesFolder, {
	acceptRanges: false,
	cacheControl: false,
	index: false,
	setHeaders: (response, path) => {
		response.setHeader("Cache-Control", imageCache)
		response.type(mime.getType(path))
	}
}))

app.get(["/", "/index.html"], (request, response) => HandlePugRequests(indexPage, request, response))
app.get("/documents", (request, response) => HandlePugRequests(documentsPage, request, response))
app.get("/login", (request, response) => HandlePugRequests(loginPage, request, response))

app.use("/scripts", express.static(scriptsFolder, {
	dotfiles: "deny",
	acceptRanges: false,
	cacheControl: false,
	setHeaders: (response) => {
		response.setHeader("Cache-Control", staticCache)
	}
}))

app.use("/styles", express.static(stylesFolder, {
	dotfiles: "deny",
	acceptRanges: false,
	cacheControl: false,
	setHeaders: (response) => {
		response.setHeader("Cache-Control", staticCache)
	}
}))

app.use(ApiRouter)

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
