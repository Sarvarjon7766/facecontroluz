import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Login = () => {
	// Form ma'lumotlari va holatlari
	const [formData, setFormData] = useState({
		username: '',
		password: ''
	})

	const [isFocused, setIsFocused] = useState({
		username: false,
		password: false
	})

	const [isLoading, setIsLoading] = useState(false)
	const [isCheckingToken, setIsCheckingToken] = useState(true)
	const navigate = useNavigate()

	// Token tekshirish funksiyasi
	const verifyToken = async (token) => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BASE_URL}/api/user/verify-token`,
				{
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					timeout: 10000
				}
			)
			return response.data?.success || false
		} catch (error) {
			return false
		}
	}

	const redirectBasedOnRole = (role) => {
		const lowerRole = role?.toLowerCase()

		switch (lowerRole) {
			case 'admin':
				navigate('/admin', { replace: true })
				break
			case 'viewer':
				navigate('/viewer', { replace: true })
				break
			case 'post':
				navigate('/post', { replace: true })
				break
			default:
				navigate('/', { replace: true })
		}
	}

	// Komponent yuklanganda token tekshirish
	useEffect(() => {
		const checkAuthStatus = async () => {
			const token = localStorage.getItem('token')
			const role = localStorage.getItem('content-type')

			// Agar token yoki role bo'lmasa
			if (!token || !role) {
				setIsCheckingToken(false)
				return
			}

			// Token haqiqiyligini tekshirish
			const isValidToken = await verifyToken(token)

			if (isValidToken) {
				redirectBasedOnRole(role)
			} else {
				// Noto'g'ri token, saqlangan ma'lumotlarni tozalash
				localStorage.removeItem('token')
				localStorage.removeItem('content-type')
			}

			setIsCheckingToken(false)
		}

		checkAuthStatus()
	}, [navigate])

	// Input maydonlarini boshqarish
	const handleChange = (e) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value
		}))
	}

	// Formani yuborish
	const handleSubmit = async (e) => {
		e.preventDefault()

		// Maydonlarni to'ldirishni tekshirish
		if (!formData.username.trim() || !formData.password.trim()) {
			toast.error('Iltimos, barcha maydonlarni to\'ldiring', {
				position: "top-right",
				autoClose: 3000,
			})
			return
		}

		setIsLoading(true)

		try {
			// Autentifikatsiya so'rovini yuborish
			const res = await axios.post(
				`${import.meta.env.VITE_BASE_URL}/api/user/auth`,
				formData,
				{
					headers: {
						'Content-Type': 'application/json'
					},
					timeout: 10000 // 10 soniya timeout
				}
			)

			if (res.data?.success) {
				const token = res.data.token
				const role = res.data.role?.toLowerCase()

				// Token va rolni saqlash
				localStorage.setItem('token', token)
				localStorage.setItem('content-type', role)

				// Rollar ro'yxati
				const validRoles = ['admin', 'viewer', 'post']

				// Rolni tekshirish
				if (!validRoles.includes(role)) {
					toast.error('Sizga kirish uchun ruxsat yo\'q', {
						position: "top-right",
						autoClose: 3000,
					})
					return
				}

				// Muvaffaqiyatli kirish xabari
				toast.success('Muvaffaqiyatli kirish!', {
					position: "top-right",
					autoClose: 2000,
				})

				// Rolga qarab yo'naltirish
				redirectBasedOnRole(role)
			} else {
				toast.error('Login yoki parol noto\'g\'ri', {
					position: "top-right",
					autoClose: 3000,
				})
			}
		} catch (error) {
			// Xatoliklarni boshqarish
			let errorMessage = 'Tizimda xatolik yuz berdi'

			if (axios.isAxiosError(error)) {
				if (error.code === 'ECONNABORTED') {
					errorMessage = 'Serverga ulanib bo\'lmadi (timeout)'
				} else if (error.response?.status === 401) {
					errorMessage = 'Kirish rad etildi. Login yoki parol noto\'g\'ri'
				} else {
					errorMessage = error.response?.data?.message ||
						error.message ||
						'Serverga ulanib bo\'lmadi'
				}
			}

			toast.error(errorMessage, {
				position: "top-right",
				autoClose: 5000,
			})
		} finally {
			setIsLoading(false)
		}
	}

	// Token tekshirilayotgan paytda yuklanish ko'rsatkichi
	if (isCheckingToken) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<p className="mt-4 text-gray-600">Tizim tekshirilmoqda...</p>
				</div>
			</div>
		)
	}

	// Asosiy render qismi
	return (
		<div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
			<div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 text-white p-12 flex-col justify-center relative overflow-hidden">
				<div className="absolute inset-0 opacity-10">
					<div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Samarkand_%28emblem%29.svg/1200px-Samarkand_%28emblem%29.svg.png')] bg-center bg-contain bg-no-repeat"></div>
				</div>

				<div className="relative z-10 max-w-md mx-auto">
					<div className="flex items-center mb-6">
						<div className="bg-none p-2 rounded-full mr-4">
							<img
								src="/hokimiyat-logo.png"
								alt="Samarqand gerbi"
								className="w-16 h-16 object-contain"
							/>
						</div>
						<div>
							<h1 className="text-3xl font-bold">Samarqand Viloyati</h1>
							<h2 className="text-xl font-semibold text-blue-200">Hokimligi</h2>
						</div>
					</div>

					<h2 className='text-2xl font-bold mb-2 text-blue-100'>Ish Nazorat Platformasi</h2>

					<div className="space-y-4 mb-8">
						<div className="flex items-start">
							<svg className="w-5 h-5 mt-1 mr-2 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
							<p className="text-blue-100 text-lg leading-relaxed">
								Xodimlarning ish vaqtini avtomatlashtirilgan nazorat qilish tizimi
							</p>
						</div>
						<div className="flex items-start">
							<svg className="w-5 h-5 mt-1 mr-2 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<p className="text-blue-100 text-lg leading-relaxed">
								Ishga kelish-ketish vaqtlarini aniq hisobga olish
							</p>
						</div>
					</div>

					<div className="mt-12 pt-6 border-t border-blue-400 border-opacity-30">
						<p className="text-blue-200 text-sm">Texnik yordam uchun:</p>
						<p className="text-white font-medium text-xl mt-1">+998 66 235 24 60</p>
						<p className="text-blue-200 mt-2">Samarqand viloyat hokimligi huzuridagi Axborot-kommunikatsiya texnologiyalarini rivojlantirish markazi</p>
					</div>
				</div>
			</div>

			<div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[url('https://www.goodcore.co.uk/blog/wp-content/uploads/2019/08/coding-vs-programming-2.jpg')] bg-cover bg-center">
				<div className="w-full max-w-md bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-gray-200">
					<div className="text-center mb-8">
						<div className="md:hidden flex justify-center mb-4">
							<div className="bg-none p-3 rounded-full">
								<img
									src="/hokimiyat-logo.png"
									alt="Samarqand gerbi"
									className="w-14 h-14 object-contain"
								/>
							</div>
						</div>
						<h2 className="text-2xl md:text-3xl font-bold text-gray-800">Tizimga kirish</h2>
						<p className="text-gray-600 mt-2">Samarqand viloyati hokimligi xodimlari uchun</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="relative">
							<label
								htmlFor="username"
								className={`absolute left-4 transition-all duration-200 ${isFocused.username || formData.username
									? '-top-2.5 text-xs bg-gray-50 border rounded-lg px-2 text-blue-600'
									: 'top-3.5 text-gray-500'
									}`}
							>
								Foydalanuvchi nomi
							</label>
							<input
								type="text"
								id="username"
								name="username"
								value={formData.username}
								onChange={handleChange}
								onFocus={() => setIsFocused(prev => ({ ...prev, username: true }))}
								onBlur={() => setIsFocused(prev => ({ ...prev, username: false }))}
								className="w-full p-3 border-2 text-gray-800 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
								disabled={isLoading}
								autoComplete="username"
							/>
						</div>

						<div className="relative">
							<label
								htmlFor="password"
								className={`absolute left-4 transition-all duration-200 ${isFocused.password || formData.password
									? '-top-2.5 text-xs bg-gray-50 border rounded-lg px-2 text-blue-600'
									: 'top-3.5 text-gray-500'
									}`}
							>
								Parol
							</label>
							<input
								type="password"
								id="password"
								name="password"
								value={formData.password}
								onChange={handleChange}
								onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
								onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
								className="w-full p-3 border-2 text-gray-800 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
								disabled={isLoading}
								autoComplete="current-password"
							/>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className={`w-full bg-gradient-to-r from-blue-700 to-blue-600 text-white py-3.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-800 hover:to-blue-700'
								}`}
						>
							{isLoading ? (
								<span className="flex items-center justify-center">
									<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Kirish...
								</span>
							) : (
								<span className="flex items-center justify-center">
									<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
									</svg>
									Kirish
								</span>
							)}
						</button>
					</form>

					<div className="mt-8 pt-6 border-t border-gray-200 md:hidden text-center">
						<p className="text-gray-600 text-sm">© 2025 Samarqand viloyati hokimligi</p>
						<p className="text-blue-600 font-medium mt-1">Axborot-kommunikatsiya texnologiyalarini rivojlantirish markazi</p>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Login