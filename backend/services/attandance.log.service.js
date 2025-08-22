const attandanceLogModel = require('../models/attandance.log.model')
const attandanceModel = require('../models/attandance.model')
const userModel = require('../models/user.model')
const dayjs = require("dayjs")
const utc = require("dayjs/plugin/utc")
const timezone = require("dayjs/plugin/timezone")
dayjs.extend(utc)
dayjs.extend(timezone)
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore")
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter")
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

class AttandanceLogService {
	async logComment(id, data) {
		try {
			const log = await attandanceLogModel.findById(id)
			if (log) {
				log.comment = data.comment
				await log.save()
				return { success: true, message: "Izoh saqlandi" }
			} else {
				return { success: false, message: "Kirish arxivi topilmadi" }
			}
		} catch (error) {
			console.error("logComment xatolik:", error)
			return { success: false, message: "Server xatosi" }
		}
	}
	async LogStatistiks({ startDate, endDate }) {
		try {
			if (!startDate || !endDate) {
				return { success: false, message: "Boshlanish va tugash sanalari kerak" }
			}

			// startDate = "2025-08-19"
			// endDate   = "2025-08-21"

			const users = await userModel.find()

			// 📌 endi date o‘rniga dateString bo‘yicha qidiramiz
			const logs = await attandanceLogModel.find({
				dateString: { $gte: startDate, $lte: endDate }
			}).populate("user", "fullName position")

			const stats = []

			for (const user of users) {
				const userLogs = logs.filter(l => l.user._id.toString() === user._id.toString())

				let dailyDetails = []
				let current = dayjs(startDate)

				while (current.isSameOrBefore(endDate)) {
					const currentDateString = current.format("YYYY-MM-DD")

					// Shu kunga tegishli loglar
					const dayLogs = userLogs.filter(l => l.dateString === currentDateString)

					let sessions = []
					dayLogs.forEach(l => {
						if (l.checkInTime && l.checkOutTime) {
							const durationMs = l.checkOutTime - l.checkInTime
							const durationH = (durationMs / (1000 * 60 * 60)).toFixed(2)
							sessions.push({
								checkIn: l.checkInTime,
								checkOut: l.checkOutTime,
								duration: durationH
							})
						} else if (l.checkInTime && !l.checkOutTime) {
							sessions.push({
								checkIn: l.checkInTime,
								checkOut: null,
								duration: null
							})
						}
					})

					dailyDetails.push({
						date: currentDateString,
						sessions
					})

					current = current.add(1, "day")
				}

				stats.push({
					user: user.fullName,
					position: user.position || null,
					details: dailyDetails
				})
			}

			return { success: true, stats }
		} catch (err) {
			console.error(err)
			return { success: false, message: "Xatolik yuz berdi" }
		}
	}

}
module.exports = new AttandanceLogService()