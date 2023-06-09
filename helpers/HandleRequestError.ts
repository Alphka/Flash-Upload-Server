import type { APIResponseError } from "../typings/api"
import { AxiosError } from "axios"
import { toast } from "react-toastify"

export default function HandleRequestError(error: any){
	switch(typeof error){
		case "string":
			toast.error(error)
		break
		case "object":
			if(error.isAxiosError){
				const { code, response } = error as AxiosError<APIResponseError>
				toast.error(code === "ERR_NETWORK" ? "Conexão com a internet indisponível" : response?.data.error ?? "Algo deu errado")
			}
		break
		case "number":
		case "boolean":
		case "undefined":
			console.error(error)
		break
	}
}
