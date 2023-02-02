import type { InputHTMLAttributes, CSSProperties } from "react"
import { forwardRef, memo } from "react"
import style from "../../../../styles/modules/settings.module.scss"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string
	color: string
	error: string | undefined
	icon?: JSX.Element | null
}

const Input = memo(forwardRef<HTMLInputElement, InputProps>(function Input({
	label,
	color,
	error,
	type,
	icon,
	...rest
}, ref){
	const props = {
		...rest,
		style: { "--color": color } as CSSProperties,
		type: type || "text",
		ref
	}

	return (
		<div>
			<span className={style.label}>{label}</span>
			<input {...props} />
			{error && <span className={style.error}>{error}</span>}
			{icon}
		</div>
	)
}))

export default Input
