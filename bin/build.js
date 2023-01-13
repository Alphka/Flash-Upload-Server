#!/usr/bin/env node

import { join, relative, dirname, sep, parse } from "path"
import { existsSync, unwatchFile, watchFile } from "fs"
import { readdir, writeFile, mkdir } from "fs/promises"
import { fileURLToPath } from "url"
import { GetConfig } from "./helpers/Config.js"
import sass from "sass"
import axios from "axios"
import webpack from "webpack"
import GetNumber from "./helpers/GetNumber.js"
import AddFolderToEntries from "./helpers/AddFolderToEntries.js"
import WatchedGlobEntries from "webpack-watched-glob-entries-plugin"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let config = GetConfig()

const args = process.argv.slice(2)
const rootFolder = join(__dirname, "..")
const buildFolder = join(rootFolder, "build")
const srcFolder = join(rootFolder, "src")
const stylesFolder = join(srcFolder, "styles")
const isDevelopment = process.env.NODE_ENV === "development"
const isWatching = args.includes("--watch")
const packageName = process.env.npm_package_name || "package"
const outputStyle = isDevelopment ? "expanded" : "compressed"

if(!isDevelopment) process.env.NODE_ENV = "production"

const port = isWatching ? GetNumber(3000, process.env.PORT, config.port) : null
const defaultDelay = 300

/** @type {NodeJS.Timeout | null} */
let timeout = null
let reloadDate = Date.now()

/** @param {string} query */
function Reload(query, delay = defaultDelay){
	const date = Date.now()

	if(reloadDate + delay < date){
		reloadDate = date
		return axios.get(`http://127.0.0.1:${port}/api/reload?` + query)
	}
}

function ReloadStyle(delay = defaultDelay){
	if(timeout) clearTimeout(timeout)

	timeout = setTimeout(() => {
		timeout = null
		Reload("detail=style", delay)
	}, 20)
}

function ReloadScript(delay = defaultDelay){
	return Reload("detail=script", delay)
}

/** @param {string} page */
function ReloadPage(page, delay = defaultDelay){
	return Reload(`detail=page&page=${page}`, delay)
}

if(isWatching){
	const regex = /\.pug$/i
	const pagesFolder = join(rootFolder, "public/pages")

	readdir(pagesFolder, { withFileTypes: true }).then(all => {
		const pages = all.filter(file => file.isFile()).filter(({ name }) => regex.test(name))

		for(const { name } of pages){
			const path = join(pagesFolder, name)

			watchFile(path, { interval: defaultDelay }, (current, previous) => {
				if(current.mtime !== previous.mtime) return ReloadPage(parse(name).name)
			})
		}
	})
}

readdir(stylesFolder, { withFileTypes: true }).then(async files => {
	const regex = /\.s[ca]ss$/i
	const styles = files.filter(file => file.isFile() && regex.test(file.name))
	const outputFolder = join(buildFolder, "styles")

	if(!existsSync(outputFolder)) await mkdir(outputFolder, { recursive: true })

	const promises = []

	for(const { name } of styles){
		const stylePath = join(stylesFolder, name)
		const relativePath = relative(rootFolder, stylePath)
		const cssName = name.replace(regex, ".css")
		const cssPath = join(outputFolder, cssName)
		const sourceMapName = cssName + ".map"
		const sourceMapPath = join(outputFolder, sourceMapName)
		const sepRegex = new RegExp("\\" + sep, "g")

		let firstCompilation = true

		async function Compile(){
			try{
				if(!existsSync(stylePath)) throw new Error("Style does not exist: " + relativePath)

				const { css, sourceMap, loadedUrls } = sass.compile(stylePath, {
					alertAscii: false,
					alertColor: true,
					charset: true,
					style: outputStyle,
					sourceMap: true,
					sourceMapIncludeSources: true
				})

				const { sources } = sourceMap
				const { length } = sources

				for(let index = 0; index < length; index++){
					const source = sources[index]
					const path = relative(rootFolder, fileURLToPath(source)).replace(sepRegex, "/")

					sources[index] = `webpack://${packageName}/./${path}`
				}

				await Promise.all([
					writeFile(cssPath, css + `\n/*# sourceMappingURL=${sourceMapName} */`, "utf8"),
					writeFile(sourceMapPath, JSON.stringify(sourceMap), "utf8")
				])

				if(isWatching){
					if(!firstCompilation) return

					firstCompilation = false

					const config = { interval: 300 }

					async function CompileWatched(){
						try{
							const date = Date.now()
							await Compile()
							console.log(`Style compiled in ${Date.now() - date} ms - ${relativePath}`)
							ReloadStyle()
						}catch(error){
							console.error(error)
						}
					}

					watchFile(stylePath, config, CompileWatched)

					for(const url of loadedUrls){
						const file = fileURLToPath(url)
						if(file !== stylePath) watchFile(file, config, CompileWatched)
					}
				}
			}catch(error){
				watchFile(stylePath, async function Listener(){
					try{
						unwatchFile(stylePath, Listener)
						await Compile()
					}catch(error){
						console.error(error)
					}
				})

				console.error(error)
			}
		}

		promises.push(Compile())
	}

	await Promise.all(promises)

	console.log("Stylesheets compiled")
})

let firstCompilation = true

webpack({
	mode: "production",
	target: "web",
	devtool: "source-map",
	cache: isDevelopment,
	watch: isWatching,
	entry: AddFolderToEntries(WatchedGlobEntries.getEntries(["src/scripts/*.ts"], {
		cwd: rootFolder,
		absolute: true
	})()),
	output: {
		filename: "[name].js",
		path: buildFolder
	},
	module: {
		rules: [
			{
				test: /\.ts$/i,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
						options: {
							configFile: join(srcFolder, "tsconfig.json"),
							ignoreDiagnostics: [2732, 7006]
						}
					}
				]
			}
		]
	},
	resolve: {
		extensions: [".ts", ".js"]
	},
	plugins: [
		new WatchedGlobEntries()
	]
}, (error, stats) => {
	if(error || stats.hasErrors()) return console.error(error ?? stats.toJson().errors[0].stack)

	if(stats.hasErrors()){
		const info = stats.toJson()
		for(const error of info.errors) console.error(error.stack)
		return
	}

	if(stats.hasWarnings()){
		const info = stats.toJson()
		for(const warning of info.warnings) console.error(warning.stack)
		return
	}

	console.log(stats.toString({
		chunks: false,
		colors: true
	}))

	if(firstCompilation) firstCompilation = false
	else if(isWatching) return ReloadScript()
})
