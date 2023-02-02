import { memo, forwardRef, useState, useCallback, useEffect } from "react"
import useForwardedRef from "../../../../helpers/useForwardedRef"
import FocusInput from "../../helpers/FocusInput"
import Input from "."

interface PasswordInputProps {
	error: string | undefined
}

interface PasswordIconProps {
	showPassword: boolean
	toggleVisibility: () => any
}

const PasswordIcon = memo<PasswordIconProps>(function ShowPassword({ showPassword, toggleVisibility }){
	return (
		<span className="icon material-symbols-outlined" onClick={toggleVisibility}>
			{showPassword ? "visibility_off" : "visibility"}
		</span>
	)
})

const PasswordInput = memo(forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput({ error }, ref){
	const [showPassword, setShowPassword] = useState(false)
	const [randomPassword, setRandomPassword] = useState("")
	const toggleVisibility = useCallback(() => setShowPassword(!showPassword), [showPassword])
	const forwardedRef = useForwardedRef(ref)

	useEffect(() => setRandomPassword(Math.random().toString(32).substring(2)), [])

	return <Input {...{
		ref: forwardedRef,
		error,
		label: "Senha:",
		color: "#7831ff",
		type: showPassword ? "text" : "password",
		required: true,
		autoComplete: "new-password",
		placeholder: `Ex: ${randomPassword}`,
		className: "no-outline",
		onKeyPress: FocusInput(forwardedRef),
		icon: forwardedRef.current?.value ? <PasswordIcon {...{ showPassword, toggleVisibility }} /> : null
	}} />
}))

export default PasswordInput
