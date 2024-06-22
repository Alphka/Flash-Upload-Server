import type { Dispatch, MutableRefObject, SetStateAction } from "react"
import type { INotificationData } from "@api/notifications/typings"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { MdNotificationsActive, MdNotificationsNone } from "react-icons/md"
import { APIResponse } from "@typings/api"
import { twJoin } from "tailwind-merge"
import LocalReadNotifications from "@helpers/LocalReadNotifications"
import Notification from "./components/Notification"
import useSWR from "swr"

interface NotificationsProps {
	mobile?: boolean
	openRef?: MutableRefObject<boolean | null>
	closeIcons?: () => void
	setCloseCallback?: Dispatch<SetStateAction<() => void>>
}

const Notifications = memo(function Notifications({ mobile = false, openRef, closeIcons, setCloseCallback }: NotificationsProps){
	const { data, error } = useSWR("/api/notifications", async (url: string) => {
		const response = await fetch(url, { cache: "no-cache" })
		const json = await response.json() as APIResponse<INotificationData[]>

		if(!json.success) throw new Error(json.error || "Algo deu errado")

		return json.data
	}, {
		onErrorRetry(error, _key, _config, revalidate, { retryCount }){
			if(error.status === 404 || retryCount > 10) return
			setTimeout(() => revalidate({ retryCount }), 3e3)
		}
	})

	const [notificationsUnread, setNotificationsUnread] = useState(false)
	const [contentHidden, setContentHidden] = useState(true)
	const ref = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		if(setCloseCallback) setCloseCallback(() => () => setContentHidden(true))
	}, [setCloseCallback])

	const markAsRead = useCallback(() => {
		if(data?.length){
			const hashes = data.map(({ hash }) => hash)
			LocalReadNotifications.AddHashes(hashes)
		}else{
			LocalReadNotifications.SetHashes([])
		}

		setNotificationsUnread(false)
	}, [data, contentHidden])

	useEffect(() => {
		let unread = false

		if(data?.length){
			const localHashes = LocalReadNotifications.GetHashes()

			if(localHashes.length){
				const hashes = data.map(({ hash }) => hash)

				for(const hash of hashes){
					if(!localHashes.includes(hash)){
						unread = true
						break
					}
				}

				// Remove old hashes from local storage
				let outdatedHashes: string[] = []

				for(const hash of localHashes){
					if(!hashes.includes(hash)) outdatedHashes.push(hash)
				}

				if(outdatedHashes.length){
					LocalReadNotifications.SetHashes(localHashes.filter(hash => !outdatedHashes.includes(hash)))
				}
			}else unread = true

		}else unread = false

		setNotificationsUnread(unread)
	}, [data])

	const Content = useCallback(function Content(){
		if(error) return <p className="error">Algo deu errado</p>

		if(data){
			if(data.length){
				// TODO: Get this from config
				const limit = 5
				const shouldLimit = data.length > limit
				const notifications = data
					.map(({ expiresAt, ...data }) => ({
						expiresAt: new Date(expiresAt).getTime(),
						expiresAtString: expiresAt,
						...data
					}))
					.sort((a, b) => b.expiresAt - a.expiresAt)
					.slice(0, limit)
					.map(({ hash, expiresAtString, ...data }) => (
						<Notification {...{
							...data,
							expiresAt: expiresAtString
						}} key={hash} />
					))

				if(shouldLimit){
					const limited = data.length - limit
					const message = `${limited} ${limited === 1 ? " notificação foi oculta" : "notificações foram ocultas"}`

					return <>
						{notifications}
						<p className="more">{message}</p>
					</>
				}

				return <>{notifications}</>
			}

			return <p>Não há notificações no momento</p>
		}

		return <p>Carregando...</p>
	}, [data, error])

	const Icon = notificationsUnread ? MdNotificationsActive : MdNotificationsNone

	return (
		<div className={twJoin("notifications", mobile && "mobile")}>
			<button
				aria-label="Notificações"
				onClick={event => {
					event.nativeEvent.stopImmediatePropagation()
					event.preventDefault()

					function CloseHandler(event: globalThis.MouseEvent){
						if(ref.current && event.target instanceof HTMLElement){
							if(event.target === ref.current || ref.current.contains(event.target)) return
						}

						setContentHidden(true)
						event.preventDefault()
						window.removeEventListener("click", CloseHandler)
					}

					if(openRef) openRef.current = contentHidden

					if(contentHidden){
						markAsRead()
						closeIcons?.()
						setContentHidden(false)
						window.addEventListener("click", CloseHandler)
					}else{
						setContentHidden(true)
						window.removeEventListener("click", CloseHandler)
					}
				}}
				ref={ref}
			>
				<Icon className="icon" />
			</button>

			<div className={twJoin("content", contentHidden && "hidden")} aria-hidden={contentHidden}>
				<p className="title">
					Notificações
				</p>
				<hr />
				<Content />
			</div>
		</div>
	)
})

export default Notifications
