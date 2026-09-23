const { join } = require("path")

/** @type {import("next").NextConfig} */
module.exports = {
	productionBrowserSourceMaps: true,
	logging: {
		fetches: {
			fullUrl: true,
			hmrRefreshes: true
		}
	},
	sassOptions: {
		includePaths: [join(__dirname, "styles")]
	}
}
