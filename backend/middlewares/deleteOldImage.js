const fs = require('fs').promises
const path = require('path')
const User = require('../models/user.model.js')

const deleteOldImage = async (req, res, next) => {
	try {
		const userId = req.params.id
		const existingUser = await User.findById(userId)

		if (!existingUser) {
			return res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
		}

		// Faqat yangi rasm yuklanganda eski rasmni o'chirish
		if (req.file && existingUser.photo) {
			const oldImagePath = path.resolve(__dirname, '../uploads', existingUser.photo)
			try {
				await fs.access(oldImagePath) // fayl mavjudligini tekshirish
				await fs.unlink(oldImagePath) // eski rasmni o'chirish
				console.log(`Eski rasm o‘chirildi: ${oldImagePath}`)
			} catch (err) {
				console.warn(`Eski rasm topilmadi yoki o‘chirib bo‘lmadi: ${oldImagePath}`)
			}
		}

		next()
	} catch (err) {
		console.error('Eski rasmni o‘chirishda xatolik:', err)
		next()
	}
}

module.exports = deleteOldImage
