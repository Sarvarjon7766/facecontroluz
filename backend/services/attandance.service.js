const attandanceLogModel = require('../models/attandance.log.model')
const attandanceModel = require('../models/attandance.model')
const postLogModel = require('../models/post.log.model')
const userModel = require('../models/user.model')

const dayjs = require("dayjs")
const utc = require("dayjs/plugin/utc")
const tz = require("dayjs/plugin/timezone")
dayjs.extend(utc)
dayjs.extend(tz)
class AttandanceService {

	async attendanceGetOne(userId) {
		try {
			// 📌 Hozirgi vaqt va local sana (Asia/Tashkent bo‘yicha)
			const now = new Date()
			const dateString = dayjs(now).tz("Asia/Tashkent").format("YYYY-MM-DD")

			// 📌 Faqat bir kunlik attendance olish
			const attendanceRecords = await attandanceModel.find({
				user: userId,
				dateString: dateString
			})
				.sort({ date: -1 })
				.lean()

			const history = []

			for (const record of attendanceRecords) {
				// Shu kunning loglarini olish
				const logs = await attandanceLogModel.find({
					user: userId,
					dateString: dateString
				}).sort({ date: 1 }).lean()

				// Birinchi kirish va oxirgi chiqish
				const firstCheckIn = logs.find(log => log.checkin && log.checkInTime)?.checkInTime || null
				const lastCheckOut = [...logs].reverse().find(log => log.checkout && log.checkOutTime)?.checkOutTime || null

				let hoursWorked = 0
				if (firstCheckIn && lastCheckOut) {
					hoursWorked = ((new Date(lastCheckOut) - new Date(firstCheckIn)) / (1000 * 60 * 60)).toFixed(2)
				}

				history.push({
					_id: record._id,
					user: record.user,
					date: record.date,
					dateString: record.dateString, // 📌 endi dateString ham bor
					status: record.status,
					totalTime: record.totalTime,
					totalEntries: record.totalEntries,
					createdAt: record.createdAt,
					updatedAt: record.updatedAt,
					arrivalTime: firstCheckIn,
					departureTime: lastCheckOut,
					hoursWorked: Number(hoursWorked),
					logs
				})
			}

			return { success: true, attendanceHistory: history }

		} catch (error) {
			console.error("Attendance history error:", error)
			return { success: false, message: "Server xatosi", error: error.message }
		}
	}
	async checkInAttendance(data) {
		try {
			console.log(data)
			const eventTime = new Date()
			const dateString = dayjs(eventTime).tz("Asia/Tashkent").format("YYYY-MM-DD")
			const isEntering = Number(data.where) === 2

			const postlog = await postLogModel.findOneAndUpdate(
				{ post: Number(data.qayer) },
				{ $setOnInsert: { post: Number(data.qayer) } },
				{ new: true, upsert: true }
			)

			const user = await userModel.findOne({ hodimID: data.employee_id })
			if (!user) return { success: false, message: "Foydalanuvchi topilmadi" }

			// 🔹 Oxirgi logni olish
			const lastLog = await attandanceLogModel.findOne({ user: user._id }).sort({ date: -1 })
			if (lastLog) {
				const diffSeconds = (eventTime - lastLog.date) / 1000
				if (diffSeconds < 15) {
					return { success: false, message: "Qayta kirish/chiqish uchun kamida 15 soniya kuting" }
				}
			}

			let attendance = await attandanceModel.findOne({
				user: user._id,
				dateString: dateString
			})

			if (isEntering) {
				if (attendance && attendance.status === 'ishda') {
					return { success: false, message: "Foydalanuvchi hali chiqmagan" }
				}
				if (!attendance) {
					attendance = await attandanceModel.create({
						user: user._id,
						date: eventTime,
						dateString,
						status: 'ishda',
						totalTime: "0:00",
						totalEntries: 1
					})
				} else {
					attendance.status = 'ishda'
					attendance.totalEntries += 1
					await attendance.save()
				}
				await attandanceLogModel.create({
					user: user._id,
					date: eventTime,
					dateString,
					checkin: true,
					checkout: false,
					checkInTime: eventTime
				})
			} else {
				if (!attendance || attendance.status === 'tashqarida') {
					return { success: false, message: "Kirish topilmadi" }
				}
				const openLog = await attandanceLogModel.findOne({
					user: user._id,
					dateString,
					checkin: true,
					checkout: false
				})
				if (!openLog) return { success: false, message: "Kirish logi topilmadi" }

				openLog.checkout = true
				openLog.checkOutTime = eventTime
				await openLog.save()

				const workMs = openLog.checkOutTime - openLog.checkInTime
				const prevParts = attendance.totalTime.split(":").map(Number)
				const prevMinutes = prevParts[0] * 60 + prevParts[1]
				const totalMinutes = prevMinutes + Math.floor(workMs / 60000)
				const hours = Math.floor(totalMinutes / 60)
				const minutes = totalMinutes % 60
				attendance.status = 'tashqarida'
				attendance.totalTime = `${hours}:${minutes.toString().padStart(2, '0')}`
				await attendance.save()
			}

			postlog.set({
				fullName: user.fullName,
				position: user.position,
				photo: user.photo,
				department: user.department,
				typeStatus: isEntering
			})
			await postlog.save()

			return { success: true, message: isEntering ? "Kirish qayd etildi" : "Chiqish qayd etildi" }
		} catch (error) {
			console.error('Create attendance error:', error)
			return { success: false, message: "Server error", error: error.message }
		}
	}



	// async checkInAttendance(data) {
	// 	try {
	// 		const eventTime = new Date()
	// 		const dateString = dayjs(eventTime).tz("Asia/Tashkent").format("YYYY-MM-DD")
	// 		const isEntering = Number(data.where) === 2
	// 		const postlog = await postLogModel.findOneAndUpdate(
	// 			{ post: Number(data.where) },
	// 			{ $setOnInsert: { post: Number(data.where) } },
	// 			{ new: true, upsert: true }
	// 		)
	// 		const user = await userModel.findOne({ hodimID: data.employee_id })
	// 		if (!user) return { success: false, message: "Foydalanuvchi topilmadi" }
	// 		let attendance = await attandanceModel.findOne({
	// 			user: user._id,
	// 			dateString: dateString
	// 		})
	// 		if (isEntering) {
	// 			if (attendance && attendance.status === 'ishda') {
	// 				return { success: false, message: "Foydalanuvchi hali chiqmagan" }
	// 			}
	// 			if (!attendance) {
	// 				attendance = await attandanceModel.create({
	// 					user: user._id,
	// 					date: eventTime,
	// 					dateString,
	// 					status: 'ishda',
	// 					totalTime: "0:00",
	// 					totalEntries: 1
	// 				})
	// 			} else {
	// 				attendance.status = 'ishda'
	// 				attendance.totalEntries += 1
	// 				await attendance.save()
	// 			}
	// 			await attandanceLogModel.create({
	// 				user: user._id,
	// 				date: eventTime,
	// 				dateString,
	// 				checkin: true,
	// 				checkout: false,
	// 				checkInTime: eventTime
	// 			})
	// 		} else {
	// 			if (!attendance || attendance.status === 'tashqarida') {
	// 				return { success: false, message: "Kirish topilmadi" }
	// 			}
	// 			const openLog = await attandanceLogModel.findOne({
	// 				user: user._id,
	// 				dateString,
	// 				checkin: true,
	// 				checkout: false
	// 			})
	// 			if (!openLog) return { success: false, message: "Kirish logi topilmadi" }

	// 			openLog.checkout = true
	// 			openLog.checkOutTime = eventTime
	// 			await openLog.save()
	// 			const workMs = openLog.checkOutTime - openLog.checkInTime
	// 			const prevParts = attendance.totalTime.split(":").map(Number)
	// 			const prevMinutes = prevParts[0] * 60 + prevParts[1]
	// 			const totalMinutes = prevMinutes + Math.floor(workMs / 60000)
	// 			const hours = Math.floor(totalMinutes / 60)
	// 			const minutes = totalMinutes % 60
	// 			attendance.status = 'tashqarida'
	// 			attendance.totalTime = `${hours}:${minutes.toString().padStart(2, '0')}`
	// 			await attendance.save()
	// 		}
	// 		postlog.set({
	// 			fullName: user.fullName,
	// 			position: user.position,
	// 			photo: user.photo,
	// 			department: user.department,
	// 			typeStatus: isEntering
	// 		})
	// 		await postlog.save()
	// 		return { success: true, message: isEntering ? "Kirish qayd etildi" : "Chiqish qayd etildi" }
	// 	} catch (error) {
	// 		console.error('Create attendance error:', error)
	// 		return { success: false, message: "Server error", error: error.message }
	// 	}
	// }
}

module.exports = new AttandanceService()
