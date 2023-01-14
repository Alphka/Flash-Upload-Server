/** @param {string} [defaultName] */
export default function GetPackageName(defaultName){
	const { npm_package_config_name, npm_package_name } = process.env
	return npm_package_config_name || npm_package_name || defaultName || "package"
}

/** @param {string} name */
export function CapitalizedName(name){
	return name.split("-").map(e => e.substring(0, 1).toUpperCase() + e.substring(1)).join(" ")
}
