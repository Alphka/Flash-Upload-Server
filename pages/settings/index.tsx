import type { GetServerSideProps } from "next"
import type { Config } from "../../typings/database"
import { GetCachedConfig } from "../../helpers/Config"
import ConnectDatabase from "../../lib/ConnectDatabase"
import UserComponent from "./components/User"
import Navigation from "../../components/Navigation"
import AddUser from "./components/AddUser"
import style from "../../styles/modules/settings.module.scss"
import User, { type Users } from "../../models/User"

export const getServerSideProps: GetServerSideProps = async () => {
	try{
		await ConnectDatabase()

		const users = await User.find({}, { _id: 0 }).lean()
		const config = await GetCachedConfig(true)

		return { props: { users, config } }
	}catch(error){
		console.error(error)
		return { notFound: true, error }
	}
}

interface SettingsPageProps {
	users: Users
	config: Config
}

export default function SettingsPage({ users, config }: SettingsPageProps){
	return <>
		<Navigation />

		<main className={style.main}>
			<section className={style.user_management}>
				<header>
					<h2 className={style.title}>Gerenciamento de Usuários</h2>
				</header>

				<article className={style.users}>
					<AddUser {...{ config }} />

					{users.map(({ name, password, access }, index) => (
						<UserComponent {...{
							username: name,
							password,
							access,
							createdAt: new Date
						}} key={`user-${index}`} />
					))}
				</article>
			</section>
		</main>
	</>
}
