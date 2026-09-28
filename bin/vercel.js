const { readFileSync, writeFileSync, rmSync } = require("fs")
const { join } = require("path")

const databasePath = join(process.cwd(), "database")
const configPath = join(databasePath, "config.json")
const vercelConfigPath = join(databasePath, "config.vercel.json")

/** @param {string} path */
const ReadFile = path => JSON.parse(readFileSync(path, "utf8"))

const config = ReadFile(configPath)
const vercelConfig = ReadFile(vercelConfigPath)

Object.assign(config, vercelConfig)

rmSync(vercelConfigPath, { force: true })
writeFileSync(configPath, JSON.stringify(config), "utf8")
