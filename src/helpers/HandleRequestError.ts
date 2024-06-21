import type { APIResponseError } from "../../typings/api"
import { toast, type ToastOptions } from "react-toastify"
import { AxiosError } from "axios"

export default function HandleRequestError(error: any, toastConfig?: ToastOptions){
	switch(typeof error){
		case "string":
			toast.error(error, toastConfig)
		break
		case "object":
			if(error.isAxiosError){
				const { code, response } = error as AxiosError<APIResponseError>
				toast.error(code === "ERR_NETWORK" ? "Conexão com a internet indisponível" : response?.data.error ?? "Algo deu errado", toastConfig)
			}
		break
		case "number":
		case "boolean":
		case "undefined":
			console.error(error)
			toast.error("Algo deu errado")
		break
	}
}
