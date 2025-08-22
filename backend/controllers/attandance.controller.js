const AttandanceService = require('../services/attandance.service')
class AttandanceController {
	async attendanceGetOne(req, res) {
		try {
			const { id } = req.params
			if (!id) {
				return res.status(400).json({ success: false, message: 'Foydalanuvchi ID berilmagan' })
			}
			const result = await AttandanceService.attendanceGetOne(id)

			if (result.success) {
				return res.status(200).json(result)
			} else {
				return res.status(404).json(result)
			}
		} catch (error) {
			console.error('attendanceGetOne controller error:', error)
			return res.status(500).json({ success: false, message: 'Server xatosi' })
		}
	}

	async checkInAttandance(req, res) {
		try {
			console.log(req.body)
			const result = await AttandanceService.checkInAttendance(req.body)

			if (result.success) {
				return res.status(200).json(result)
			} else {
				return res.status(400).json(result)
			}

		} catch (error) {
			console.error('Controller checkInAttandance error:', error)
			return res.status(500).json({
				success: false,
				message: "Server xatosi",
				error: error.message
			})
		}
	}
	async UserEditTime(req, res) {
		try {
			const { employee_id } = req.params
			const { type, qayer } = req.body
			console.log(employee_id)
			console.log(type)
			if (!["entry", "exit"].includes(type)) {
				return res.status(400).json({
					success: false,
					message: "Noto‘g‘ri type kiritildi. 'entry' yoki 'exit' bo‘lishi kerak."
				})
			}
			const where = type === "exit" ? "1" : "2"
			const attendancePayload = {
				qayer,
				where,
				employee_id
			}
			const result = await AttandanceService.checkInAttendance(attendancePayload)
			console.log(result)
			if (result.success) {
				return res.status(200).json({
					success: true,
					message: type === "entry" ? "Kirish qo‘lda qo‘shildi" : "Chiqish qo‘lda qo‘shildi",
					data: result
				})
			} else {
				return res.status(400).json(result)
			}
		} catch (error) {
			console.error("UserEditTime error:", error)
			return res.status(500).json({ success: false, message: "Server xatosi" })
		}
	}
}


module.exports = new AttandanceController()