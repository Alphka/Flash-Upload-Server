// @ts-check

const { join } = require("path")

/** @type {import("next").NextConfig} */
module.exports = {
	poweredByHeader: false,
	sassOptions: {
		includePaths: [join(__dirname, "styles")]
	}
}
