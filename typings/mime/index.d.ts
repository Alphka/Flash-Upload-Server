declare module "mime" {
	class Mime {
		constructor(typeMap: Record<string, string[]>, ...mimes: Record<string, string[]>[])
	}

	namespace Mime {
		export function getType(path: string): string | null
		export function getExtension(mime: string): string | null
		export function define(typeMap: Record<string, string[]>, force?: boolean): void
	}

	export = Mime
}
