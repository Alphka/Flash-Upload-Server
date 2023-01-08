import type { Configuration } from "webpack"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import WatchedGlobEntries from "webpack-watched-glob-entries-plugin"

delete process.env.TS_NODE_PROJECT

const isDevelopment = process.env.NODE_ENV === "development"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rootFolder = join(__dirname, "..")
const buildFolder = join(rootFolder, "build")

function AddFolderToEntries(entries: Record<string, string>){
	return Object.fromEntries(Object.entries(entries).map(([name, path]) => {
		const folder = path.split("/").at(-2) as string
		return [folder + "/" + name, path]
	}))
}

const config: Configuration = {
	mode: "production",
	target: "web",
	devtool: "source-map",
	cache: isDevelopment,
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
							configFile: join(rootFolder, "src/tsconfig.json"),
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
}

export default config
