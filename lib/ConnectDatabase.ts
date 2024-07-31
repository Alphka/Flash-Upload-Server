import mongoose from "mongoose"

const { MONGODB_URI } = process.env

if(!MONGODB_URI){
	throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
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

		cached.promise = mongoose.connect(MONGODB_URI!, {
			dbName: "production"
		})
	}

	try{
		cached.connection = await cached.promise
	}catch(error){
		cached.promise = null
		throw error
	}

	return cached.connection
}
