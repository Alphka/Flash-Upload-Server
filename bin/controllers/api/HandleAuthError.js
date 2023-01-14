/** @type {import("express").RequestHandler} */
export default function HandleAuthError(request, response){
	response.status(401).json({
		success: false,
		error: "Access denied"
	})
}
