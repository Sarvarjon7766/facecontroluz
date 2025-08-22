import axios from 'axios'
import { useState } from 'react'
import { FiBriefcase, FiHash, FiKey, FiUpload, FiUser, FiX } from 'react-icons/fi'
import { MdFormatListNumbered } from 'react-icons/md'
import { toast } from 'react-toastify'

const AdminUserAdd = ({ onClose, departments }) => {
	const token = localStorage.getItem('token')
	const [userData, setUserData] = useState({
		fullName: '',
		position: '',
		hodimID: '',
		lavel: '',
		username: '',
		password: '',
		department: '',
		role: 'viewer',
		isEdit: false
	})

	const [imageFile, setImageFile] = useState(null)
	const [imagePreview, setImagePreview] = useState(null)
	const [loading, setLoading] = useState(false)

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target
		setUserData({
			...userData,
			[name]: type === 'checkbox' ? checked : value
		})
	}

	const handleImageChange = (e) => {
		const file = e.target.files[0]
		if (file) {
			if (file.size > 2 * 1024 * 1024) {
				toast.error("Rasm hajmi 2MB dan oshmasligi kerak!")
				return
			}

			if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
				toast.error("Faqat JPG yoki PNG formatidagi rasmlar qabul qilinadi!")
				return
			}

			setImageFile(file)

			const reader = new FileReader()
			reader.onloadend = () => {
				setImagePreview(reader.result)
			}
			reader.readAsDataURL(file)
		}
	}

	const removeImage = () => {
		setImageFile(null)
		setImagePreview(null)
	}

	const resetForm = () => {
		setUserData({
			fullName: '',
			position: '',
			hodimID: '',
			lavel: '',
			username: '',
			password: '',
			department: null,
			role: 'viewer',
			isEdit: false
		})
		setImageFile(null)
		setImagePreview(null)
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)



		try {
			const formData = new FormData()

			Object.keys(userData).forEach(key => {
				if (userData[key] !== null && userData[key] !== undefined) {
					if (key === "department" && !userData[key]) {
						return
					}

					// Role bo‘sh bo‘lsa default "viewer" yoki userData.role
					if (key === "role" && !userData[key]) {
						formData.append("role", userData.role || "viewer")
						return
					}

					// Qolganlarini qo‘shish
					formData.append(key, userData[key])
				}
			})

			// Rasm faylini qo'shish
			if (imageFile) {
				formData.append("image", imageFile)
			}
			const res = await axios.post(
				`${import.meta.env.VITE_BASE_URL}/api/user/register`,
				formData,
				{
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'multipart/form-data'
					},
				}
			)

			if (res.data.success) {
				toast.success("Xodim muvaffaqiyatli qo'shildi!")
				resetForm()
				onClose()
			} else {
				toast.error(res.data.message || "Xodim qo'shishda xatolik")
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "Server xatosi")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
				<div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-200">
					<div className="flex justify-between items-center">
						<h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
							<FiUser className="text-blue-500" />
							Yangi xodim qo'shish
						</h2>
						<button
							onClick={() => {
								onClose()
								resetForm()
							}}
							className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
							disabled={loading}
						>
							<FiX size={24} />
						</button>
					</div>
				</div>

				<div className="p-6">
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="flex flex-col md:flex-row gap-8">
							{/* Avatar Section */}
							<div className="flex-shrink-0 flex flex-col items-center w-full md:w-1/3">
								<div className="relative mb-4 w-40 h-40">
									{imagePreview ? (
										<div className="relative group">
											<img
												src={imagePreview}
												alt="Preview"
												className="h-full w-full rounded-full object-cover border-4 border-white shadow-lg"
											/>
											<button
												type="button"
												onClick={removeImage}
												className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md"
												disabled={loading}
											>
												<FiX size={16} />
											</button>
										</div>
									) : (
										<div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center shadow-inner">
											<FiUser size={60} className="text-gray-400" />
										</div>
									)}
								</div>
								<label className={`cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm w-full justify-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
									<FiUpload size={18} /> Rasm yuklash
									<input
										type="file"
										accept="image/*"
										onChange={handleImageChange}
										className="hidden"
										disabled={loading}
									/>
								</label>
								<p className="text-xs text-gray-500 mt-2 text-center">2MB gacha (JPG, PNG)</p>
							</div>

							{/* Form Fields */}
							<div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Column 1 */}
								<div className="space-y-4">
									<div className="bg-gray-50 p-4 rounded-lg">
										<h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
											<FiUser className="text-blue-500" />
											Asosiy ma'lumotlar
										</h3>

										<div className="space-y-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1.5">Ism Familiya*</label>
												<div className="relative">
													<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
														<FiUser size={18} />
													</div>
													<input
														type="text"
														name="fullName"
														value={userData.fullName}
														placeholder="To'liq ism sharifingiz"
														onChange={handleInputChange}
														className="w-full pl-10 pr-4 py-2.5 text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
														required
														disabled={loading}
													/>
												</div>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1.5">Lavozim*</label>
												<div className="relative">
													<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
														<FiBriefcase size={18} />
													</div>
													<input
														type="text"
														name="position"
														placeholder="Lavozimi"
														value={userData.position}
														onChange={handleInputChange}
														className="w-full pl-10 text-black pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
														required
														disabled={loading}
													/>
												</div>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1.5">Hodim ID*</label>
												<div className="relative">
													<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
														<FiHash size={18} />
													</div>
													<input
														type="text"
														name="hodimID"
														placeholder="HodimID"
														value={userData.hodimID}
														onChange={handleInputChange}
														className="w-full pl-10 pr-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
														required
														disabled={loading}
													/>
												</div>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1.5">Tartib raqam*</label>
												<div className="relative">
													<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
														<MdFormatListNumbered size={20} />
													</div>
													<input
														type="number"
														name="lavel"
														placeholder="Tartib raqami"
														value={userData.lavel}
														onChange={handleInputChange}
														className="w-full pl-10 pr-4 text-black py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
														required
														disabled={loading}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Column 2 */}
								<div className="space-y-4">
									<div className="bg-gray-50 p-4 rounded-lg">
										<h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
											<FiKey className="text-blue-500" />
											Kirish ma'lumotlari
										</h3>

										<div className="space-y-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1.5">Foydalanuvchi nomi*</label>
												<div className="relative">
													<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
														<FiUser size={18} />
													</div>
													<input
														type="text"
														name="username"
														value={userData.username}
														placeholder="Foydalanuvchi nomi"
														onChange={handleInputChange}
														className="w-full pl-10 text-black pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
														required
														disabled={loading}
													/>
												</div>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1.5">Parol*</label>
												<div className="relative">
													<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
														<FiKey size={18} />
													</div>
													<input
														type="password"
														name="password"
														value={userData.password}
														placeholder="Parol kiriting ... "
														onChange={handleInputChange}
														className="w-full pl-10 text-black pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
														required
														disabled={loading}
													/>
												</div>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1.5">Bo'lim</label>
												<select
													name="department"
													value={userData.department || ""}
													onChange={handleInputChange}
													className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													disabled={loading}
												>
													<option value="">Bo'limni tanlang</option>
													{departments.map(dept => (
														<option key={dept._id} value={dept._id}>{dept.name}</option>
													))}
												</select>
											</div>

											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1.5">Rol*</label>
												<select
													name="role"
													value={userData.role || "viewer"}
													onChange={handleInputChange}
													className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													required
													disabled={loading}
												>
													<option value="">Birini tanlang</option>
													<option value="viewer">User</option>
													<option value="admin">Admin</option>
													<option value="post">Post</option>
												</select>
											</div>


											<div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
												<label htmlFor="isEdit" className="flex items-center cursor-pointer">
													<span className="text-sm font-medium text-gray-700 mr-3">
														O'zgartirish ruxsati
													</span>
													<div className="relative">
														<input
															type="checkbox"
															id="isEdit"
															name="isEdit"
															checked={userData.isEdit}
															onChange={handleInputChange}
															className="sr-only"
															disabled={loading}
														/>
														<div className={`block w-12 h-6 rounded-full ${userData.isEdit ? 'bg-blue-500' : 'bg-gray-300'} ${loading ? 'opacity-50' : ''}`}></div>
														<div
															className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${userData.isEdit ? "transform translate-x-6" : ""}`}
														></div>
													</div>
												</label>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Form Actions */}
						<div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
							<button
								type="button"
								onClick={() => {
									onClose()
									resetForm()
								}}
								className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
								disabled={loading}
							>
								Bekor qilish
							</button>
							<button
								type="submit"
								className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors font-medium shadow-sm flex items-center justify-center"
								disabled={loading}
							>
								{loading ? (
									<>
										<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Qo'shilyapti...
									</>
								) : (
									"Qo'shish"
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default AdminUserAdd
