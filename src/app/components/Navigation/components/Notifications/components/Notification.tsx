import type { INotificationData } from "@api/notifications/route"
import { memo } from "react"
import Link from "next/link"

function DateUTC(isoDate: string){
	const [year, month, day] = isoDate.substring(0, 10).split("-").map(Number) as [number, number, number]
	return Date.UTC(year, month - 1, day)
}

interface NotificationProps extends Pick<INotificationData, "folder" | "filename" | "expiresAt"> {}

const Notification = memo<NotificationProps>(function Notification({ folder, filename, expiresAt }){
	const url = `/documents/${folder.reduced?.toLowerCase() || folder.name.toLowerCase()}`
	const message = (() => {
		const today = new Date
		const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
		const expireUTC = DateUTC(expiresAt)

		let daysLeft = Math.trunc((expireUTC - todayUTC) / 86400000) // 1000 * 60 * 60 * 24

		if(daysLeft === 0) return "Expira hoje"
		if(daysLeft === 1) return "Irá expirar amanhã"

		return `${daysLeft > 0 ? "Irá expirar em" : (daysLeft = Math.abs(daysLeft), "Expirou há")} ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`
	})()

	return (
		<div className="notification">
			<p className="title">
				<Link href={url} prefetch={false}>{filename}</Link>
			</p>
			<p className="content">{message}</p>
		</div>
	)
})

export default Notification
