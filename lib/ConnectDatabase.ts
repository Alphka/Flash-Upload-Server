import mongoose from "mongoose"

const { MONGO_URL } = process.env

if(!MONGO_URL){
	throw new Error("Please define the MONGO_URL environment variable inside .env.local")
}

let cached = global.mongoose

cached ??= global.mongoose = {
	connection: null,
	promise: null
}

export default async function ConnectDatabase(){
	if(cached.connection) return cached.connection

	if(!cached.promise){
		mongoose.set("strictQuery", false)
		cached.promise = mongoose.connect(MONGO_URL!)
	}

	try{
		await cached.promise
	}catch(error){
		cached.promise = null
		throw error
	}

	return cached.connection
}
