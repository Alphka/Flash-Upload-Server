import type { APIResponseSuccess } from "@typings/api"
import type { IUpdateDocument } from "./typings"
import type { FileData } from "../typings"
import { NextResponse, type NextRequest } from "next/server"
import { GetCachedConfig } from "@helpers/Config"
import ValidateFileAccess from "@helpers/ValidateFileAccess"
import contentDisposition from "content-disposition"
import ValidateFilename from "@helpers/ValidateFilename"
import HandleAPIError from "@api/HandleAPIError"
import Authenticate from "@helpers/Authenticate"
import SendAPIError from "@api/SendAPIError"
import typeis from "type-is"
import File from "@models/File"
import mime from "mime"

export async function GET(request: NextRequest, { params: { hash } }: { params: { hash: string } }){
	if(!request.headers.get("user-agent")) return HandleAPIError("userAgent")

	try{
		const [
			file,
			{ access: userAccess }
		] = await Promise.all([
			File.findOne({ hash }),
			Authenticate()
		])

		if(!file) return SendAPIError(404, "O documento não foi encontrado")
		if(file.access === "private" && userAccess !== "all") return SendAPIError(403)

		const { content, filename } = file
		const mimeType = mime.getType(filename)

		return new NextResponse(content, {
			status: 200,
			headers: {
				Date: new Date(file.createdAt).toISOString(),
				"Cache-Control": "private, max-age=31536000",
				"Content-Length": content.byteLength.toString(),
				"Content-Type": mimeType
					? /^text\/[^; ]+$/.test(mimeType) ? mimeType + "; charset=utf-8" : mimeType
					: "application/octet-stream",
				"Content-Disposition": contentDisposition(filename, { type: "inline" }),
				Vary: "Authorization, Cookie"
			}
		})
	}catch(error){
		console.error(error)
		return SendAPIError(500)
	}
}

export async function PUT(request: NextRequest, { params: { hash } }: { params: { hash: string } }){
	const contentType = request.headers.get("content-type")

	if(!request.headers.get("user-agent")) return HandleAPIError("userAgent")
	if(!contentType || !typeis.is(contentType, "application/json")) return HandleAPIError("contentType")

	try{
		const [
			file,
			{ access: userAccess },
			{ filename, access, expireDate, createdDate },
			{ accessFiles }
		] = await Promise.all([
			File.findOne({ hash }),
			Authenticate(),
			request.json() as Promise<IUpdateDocument>,
			GetCachedConfig(true)
		])

		if(!file) return SendAPIError(404, "O documento não foi encontrado")
		if(userAccess !== "all") return SendAPIError(403)

		try{
			const data = {} as FileData

			if(filename){
				if(!ValidateFilename(filename)) throw "Nome do documento inválido"
				data.filename = filename
			}

			if(access){
				if(!ValidateFileAccess(access, accessFiles)) throw "Tipo de acesso do documento inválido"
				data.access = access
			}

			if(expireDate){
				const date = new Date(expireDate)
				if(Number.isNaN(date.getTime())) throw "Data de expiração do documento inválida"
				data.expiresAt = date
			}

			if(createdDate){
				const date = new Date(createdDate)
				if(Number.isNaN(date.getTime())) throw "Data de criação do documento inválida"
				data.createdAt = date
			}

			await file.updateOne({ $set: data })

			return NextResponse.json({ success: true } as APIResponseSuccess)
		}catch(error){
			if(typeof error === "string") return SendAPIError(400, error)

			if(error instanceof Error) error.stack = "Falha ao editar informações do documento"
			throw error
		}
	}catch(error){
		console.error(error)
		return SendAPIError(500)
	}
}

export async function DELETE(request: NextRequest, { params: { hash } }: { params: { hash: string } }){
	if(!request.headers.get("user-agent")) return HandleAPIError("userAgent")

	try{
		const [
			file,
			{ access: userAccess }
		] = await Promise.all([
			File.findOne({ hash }),
			Authenticate()
		])

		if(!file) return SendAPIError(404, "O documento não foi encontrado")
		if(userAccess !== "all") return SendAPIError(403)

		await file.deleteOne()
		return NextResponse.json({ success: true } as APIResponseSuccess)
	}catch(error){
		console.error(error)
		return SendAPIError(500, "Falha ao remover o documento")
	}
}
