declare module "webpack-watched-glob-entries-plugin" {
	import type { Compilation, Compiler } from "webpack"
	import type { IOptions } from "glob"

	interface PluginOptions {
		basename_as_entry_name?: boolean | undefined
	}

	class WebpackWatchedGlobEntries {
		static getEntries(globs: string[], globOptions?: IOptions, pluginOptions?: PluginOptions): () => Record<string, string>
		static getFiles(globString: string, globOptions?: IOptions, basename_as_entry_name?: boolean): Record<string, string>
		afterCompile(compilation: Compilation, callback: () => any): void
		apply(compiler: Compiler): void
	}

	export = WebpackWatchedGlobEntries
}
