export interface LocalNotificationsData {
	hashes?: string[]
}

export default class LocalReadNotifications {
	static key = "notifications_read" as const

	static defaultData: LocalNotificationsData = {
		hashes: []
	}

	/** @param set Set local storage if key is not found */
	static Get(set = true){
		let notifications: string | null | LocalNotificationsData = localStorage.getItem(this.key)

		if(!notifications || !(notifications = notifications.trim()).length || !/^\{(?:.|\s)+\}$/.test(notifications)){
			notifications = this.defaultData

			if(set) this.Set(notifications)

			return notifications
		}

		try{
			notifications = JSON.parse(notifications) as LocalNotificationsData

			if(typeof notifications !== "object") throw new TypeError("Invalid notifications data")

			return notifications
		}catch(error: any){
			console.error(error)
			return this.defaultData
		}
	}

	static Set(notifications: LocalNotificationsData){
		localStorage.setItem(this.key, JSON.stringify(notifications))
	}

	/** @param set Set local storage if key is not found */
	static GetHashes(set = false){
		const notifications = this.Get(set)
		return notifications.hashes || []
	}

	static SetHashes(hashes: string[]){
		const notifications = this.Get(false)

		notifications.hashes = Array.from(new Set(hashes))

		this.Set(notifications)
	}

	static AddHashes(hashes: string[]){
		const localHashes = this.GetHashes()

		this.SetHashes(localHashes.concat(hashes))
	}
}
