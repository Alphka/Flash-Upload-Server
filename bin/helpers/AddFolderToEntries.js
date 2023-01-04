/** @param {Record<string, string>} entries */
export default function AddFolderToEntries(entries){
	return Object.fromEntries(Object.entries(entries).map(([name, path]) => {
		const folder = path.split("/").at(-2)
		return [folder + "/" + name, path]
	}))
}
