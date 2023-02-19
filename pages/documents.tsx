import type { AccessTypes, IUser } from "../models/typings"
import type { GetServerSideProps } from "next"
import type { Config } from "../typings/database"
import { GetCachedConfig } from "../helpers/Config"
import ConnectDatabase from "../lib/ConnectDatabase"
import Unauthorize from "../helpers/Unauthorize"
import Navigation from "../components/Navigation"
import UserToken from "../models/UserToken"
import User from "../models/User"
import Head from "next/head"

const title = "Documentos"
const description = "Página de acesso para os documentos do Flash."

interface DocumentsProps {
	users?: IUser[]
	config: Config
	userAccess: AccessTypes
}

export const getServerSideProps: GetServerSideProps<DocumentsProps> = async ({ req, res }) => {
	try{
		await ConnectDatabase()

		const { token } = req.cookies
		const users = await User.find({}, { _id: 0, __v: 0 }).lean() as IUser[]
		const user = token ? await UserToken.findOne({ token }) : null

		if(user){
			if(user.access !== "all") return {
				redirect: {
					destination: "/?denied",
					permanent: false
				}
			}
		}else{
			if(users.length) return Unauthorize(res)
			else console.log("No users found, access permitted")
		}

		const config = await GetCachedConfig(true)

		return { props: { users, config, userAccess: user?.access || "all" } }
	}catch(error){
		console.error(error)
		return { notFound: true }
	}
}

export default function DocumentsPage({ userAccess }: DocumentsProps){
	return <>
		<Head>
			<title>Flash - {title}</title>
			<meta name="description" content={description} />
			<meta property="og:title" content={`Flash - ${title}`} />
			<meta property="og:description" content={description} />
		</Head>

		<Navigation {...{ userAccess }} />

		<main></main>
	</>
}
