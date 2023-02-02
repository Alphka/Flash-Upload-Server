import { memo, type CSSProperties } from "react"
import style from "../../../styles/modules/settings.module.scss"

interface UserProps {
	username: string
	password: string
	access: string
	createdAt: Date
}

const UserComponent = memo(function User({ username, password, access, createdAt }: UserProps){
	return (
		<div className={style.user}>
			<div className={style.header}>
				<span className="icon material-symbols-outlined">person</span>
				<span className={style.username}>{username}</span>
				<span className={`icon ${style.remove} material-symbols-outlined`} title="Remover usuário">close</span>
			</div>

			<div className={style.controls}>
				<div>
					{/* TODO: Only show password on click */}
					<span className={style.label}>Senha: {password}</span>
					<input type="button" value="Alterar senha" style={{ "--color": "#29299d" } as CSSProperties} />
				</div>
				<div>
					<span className={style.label}>Acesso: {access}</span>
					<input type="button" value="Alterar acesso" style={{ "--color": "#005aff" } as CSSProperties} />
				</div>
			</div>
		</div>
	)
})

export default UserComponent
