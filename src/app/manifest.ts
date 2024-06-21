import type { MetadataRoute, ServerRuntime } from "next"

export const runtime: ServerRuntime = "edge"

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Flash",
		short_name: "Flash",
		description: "Arquive seus documentos da Qualidade com facilidade e segurança!",
		icons: [
			{
				src: "/icons/android-chrome-192x192.png",
				sizes: "192x192",
				type: "image/png"
			},
			{
				src: "/icons/android-chrome-512x512.png",
				sizes: "512x512",
				type: "image/png"
			}
		],
		start_url: "/",
		theme_color: "#101728",
		background_color: "#101728",
		display: "standalone"
	}
}
