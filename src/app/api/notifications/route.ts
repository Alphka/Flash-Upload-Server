import type { APINotificationsResponse } from "./typings"
import type { FilterQuery } from "mongoose"
import type { IFile } from "@models/typings"
import { NextResponse, type NextRequest } from "next/server"
import { GetCachedConfig } from "@helpers/Config"
import GetDocumentType from "@helpers/GetDocumentType"
import HandleAPIError from "@api/HandleAPIError"
import Authenticate from "@helpers/Authenticate"
import GetInputDate from "@helpers/GetInputDate"
import SendAPIError from "@api/SendAPIError"
import File from "@models/File"

export async function GET(request: NextRequest){
	if(!request.headers.get("user-agent")) return HandleAPIError("userAgent")

	try{
		const user = await Authenticate()
		const config = await GetCachedConfig(true)
		const maxDate = new Date
		const query: FilterQuery<IFile> = {
			expiresAt: {
				$lte: GetInputDate(maxDate)
			}
		}

		maxDate.setDate(maxDate.getDate() + 3)

		if(user.access !== "all") query.access = "public"

		const results = await File.find(query, {
			_id: 0,
			hash: 1,
			type: 1,
			filename: 1,
			expiresAt: 1
		}).lean() as {
			hash: string
			type: number
			filename: string
			expiresAt: string
		}[]

		return NextResponse.json({
			data: results.map(({ type, ...data }) => ({
				...data,
				folder: GetDocumentType(config, type)!
			})),
			success: true
		} as APINotificationsResponse)
	}catch(error){
		console.error(error)
		return SendAPIError(500, "Não foi possível efetuar a pesquisa")
	}
}
