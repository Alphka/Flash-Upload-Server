#!/usr/bin/env node

import { join, relative, dirname, sep, parse } from "path"
import { existsSync, watch, watchFile } from "fs"
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

if(!isDevelopment) process.env.NODE_ENV = "production"

const port = GetNumber(3000, process.env.PORT, config.port)

if(isWatching){
	const regex = /\.pug$/i
	const pagesFolder = join(rootFolder, "public/pages")

	let fired = false

	watch(pagesFolder, async (event, filename) => {
		if(fired) return
		if(!regex.test(filename)) return

		fired = true

		const { name } = parse(filename)
		await axios.get(`http://127.0.0.1:${port}/api/reload?detail=page&page=${name}`)

		setTimeout(() => fired = false, 300)
	})
}

readdir(stylesFolder, { withFileTypes: true }).then(async files => {
	const regex = /\.s[ca]ss$/i
	const styles = files.filter(file => file.isFile() && regex.test(file.name))
	const outputFolder = join(buildFolder, "styles")

	if(!existsSync(outputFolder)) await mkdir(outputFolder, { recursive: true })

	const promises = []

	for(const { name } of styles){
		const path = join(stylesFolder, name)
		const style = isDevelopment ? "expanded" : "compressed"
		const cssName = name.replace(regex, ".css")
		const cssPath = join(outputFolder, cssName)
		const sourceMapName = cssName + ".map"
		const sourceMapPath = join(outputFolder, sourceMapName)
		const sepRegex = new RegExp("\\" + sep, "g")

		const Compile = () => sass.compileAsync(path, {
			alertAscii: false,
			alertColor: true,
			charset: true,
			style,
			sourceMap: true,
			sourceMapIncludeSources: true
		}).then(({ css, sourceMap }) => {
			const { sources } = sourceMap
			const { length } = sources

			for(let index = 0; index < length; index++){
				const source = sources[index]
				const path = relative(rootFolder, fileURLToPath(source)).replace(sepRegex, "/")

				sources[index] = `sass://${packageName}/./${path}`
			}

			css += `\n/*# sourceMappingURL=${sourceMapName} */`

			writeFile(cssPath, css, "utf8")
			writeFile(sourceMapPath, JSON.stringify(sourceMap), "utf8")
		})

		promises.push(Compile())

		if(isWatching){
			const relativePath = relative(rootFolder, path)

			watchFile(path, { interval: 300 }, async () => {
				const date = Date.now()

				process.stdout.write(`Compiling style - ${relativePath}`)

				try{
					await Compile()

					process.stdout.clearLine(0)
					process.stdout.cursorTo(0)
					process.stdout.write(`Style compiled in ${Date.now() - date} ms - ${relativePath}\n`)

					await axios.get(`http://127.0.0.1:${port}/api/reload?detail=style`)
				}catch(error){
					process.stdout.write("\n")
					console.error(error)
				}
			})
		}
	}

	await Promise.allSettled(promises).then(results => {
		for(const result of results){
			if(result.status === "rejected") console.error(result.reason)
		}
	})

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
	else if(isWatching) axios.get(`http://127.0.0.1:${port}/api/reload?detail=script`)
})
