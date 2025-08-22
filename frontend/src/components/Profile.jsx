import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
	const token = localStorage.getItem('token')
	const navigate = useNavigate()
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		const fetchUser = async () => {
			try {
				setLoading(true)
				setError(null)
				const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getUser`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})

				if (res.data.success) {
					setUser(res.data.user)
				} else {
					setError("Foydalanuvchi ma'lumotlari olinmadi")
				}
			} catch (error) {
				setError(error.response?.data?.message || "Server xatosi")
				if (error.response?.status === 401) {
					localStorage.removeItem('token')
					navigate('/login')
				}
			} finally {
				setLoading(false)
			}
		}

		if (token) {
			fetchUser()
		} else {
			navigate('/login')
		}
	}, [token, navigate])

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
					<p className="mt-4 text-indigo-600 font-medium animate-pulse">Ma'lumotlar yuklanmoqda...</p>
				</div>
			</div>
		)
	}

	if (error || !user) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
				<div className="p-8 bg-white rounded-2xl shadow-lg max-w-md w-full text-center border-2 border-dashed border-indigo-100">
					<div className="text-indigo-500 mb-4">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text">
						{error || "Foydalanuvchi topilmadi"}
					</h2>
					<p className="text-gray-600 mb-6">Iltimos, qaytadan urinib ko'ring</p>
					<div className="flex justify-center gap-4">
						<button
							onClick={() => window.location.reload()}
							className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-full hover:shadow-lg transition-all duration-300"
						>
							Qayta yuklash
						</button>
						<button
							onClick={() => navigate('/')}
							className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-full hover:shadow-lg transition-all duration-300"
						>
							Login sahifasiga
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen  relative">
			{/* Orqaga qaytish va chiqish tugmalari */}
			<div className="absolute flex justify-between">
				<button
					onClick={() => navigate(-1)}
					className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors duration-200 flex items-center"
					aria-label="Orqaga qaytish"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
				</button>
			</div>

			<main className="mx-auto p-3 pt-20">
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Profil kartasi */}
					<div className="w-full lg:w-1/3">
						<div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
							<div className="bg-gradient-to-r from-indigo-500 to-blue-600 h-20"></div>
							<div className="px-6 pb-8 -mt-12 relative">
								<div className="w-[7.5rem] h-[7.5rem] rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-700 mx-auto shadow-lg overflow-hidden">
									{user.photo ? (
										<img
											src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
											alt={user.fullName}
											className="w-full h-full object-cover"
											onError={(e) => {
												e.target.onerror = null
												e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23e0e7ff%22%2F%3E%3Ctext%20x%3D%22100%22%20y%3D%22110%22%20font-size%3D%2280%22%20text-anchor%3D%22middle%22%20fill%3D%22%234f46e5%22%3E" +
													(user.fullName.split(' ').map(n => n[0]).join('')) + "%3C%2Ftext%3E%3C%2Fsvg%3E"
											}}
										/>
									) : (
										user.fullName
											.split(' ')
											.map(name => name[0])
											.join('')
									)}
								</div>
								<div className="text-center mt-6">
									<h2 className="text-2xl font-bold text-gray-800">{user.fullName}</h2>
									<div className="mt-2">
										<span className="inline-block px-3 py-1 text-sm font-semibold bg-indigo-100 text-indigo-800 rounded-full">
											{user.position}
										</span>
									</div>

									<div className="mt-6 grid grid-cols-2 gap-4">
										<div className="bg-gray-50 p-3 rounded-lg">
											<p className="text-xs text-gray-500">ID raqam</p>
											<p className="font-bold text-gray-800">{user.hodimID}</p>
										</div>
										<div className="bg-gray-50 p-3 rounded-lg">
											<p className="text-xs text-gray-500">Foydalanuvchi</p>
											<p className="font-bold text-gray-800">@{user.username}</p>
										</div>
									</div>

									<div className="mt-6">
										<div className="inline-flex items-center bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-2 rounded-full">
											<span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'} mr-2`}></span>
											<span className="text-sm font-medium text-gray-700 capitalize">{user.role}</span>
										</div>
									</div>

								</div>
							</div>
						</div>
					</div>

					{/* Batafsil ma'lumotlar */}
					<div className="w-full lg:w-2/3">
						<div className="space-y-6">
							{/* Shaxsiy ma'lumotlar */}
							<div className="bg-white rounded-2xl shadow-md overflow-hidden">
								<div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4">
									<h3 className="text-lg font-semibold text-white flex items-center">
										<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
										</svg>
										Shaxsiy ma'lumotlar
									</h3>
								</div>
								<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="flex items-start">
										<div className="bg-indigo-100 p-3 rounded-lg mr-4">
											<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
											</svg>
										</div>
										<div>
											<p className="text-xs text-gray-500 uppercase tracking-wider">To'liq ismi</p>
											<p className="font-bold text-lg text-gray-800 mt-1">{user.fullName}</p>
										</div>
									</div>

									<div className="flex items-start">
										<div className="bg-blue-100 p-3 rounded-lg mr-4">
											<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
											</svg>
										</div>
										<div>
											<p className="text-xs text-gray-500 uppercase tracking-wider">Lavozimi</p>
											<p className="font-bold text-lg text-gray-800 mt-1">{user.position}</p>
										</div>
									</div>

									<div className="flex items-start">
										<div className="bg-purple-100 p-3 rounded-lg mr-4">
											<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
										</div>

									</div>

									<div className="flex items-start">
										<div className="bg-green-100 p-3 rounded-lg mr-4">
											<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</div>
										<div>
											<p className="text-xs text-gray-500 uppercase tracking-wider">Oxirgi yangilanish</p>
											<p className="font-bold text-lg text-gray-800 mt-1">
												{new Date(user?.updatedAt || "2025-08-21T07:40:47.556+00:00")
													.toLocaleString("en-US", {
														year: "numeric",
														month: "long",
														day: "numeric",
														hour: "2-digit",
														minute: "2-digit",
														timeZone: "Asia/Tashkent"
													})}
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Hisob xavfsizligi */}
							<div className="bg-white rounded-2xl shadow-md overflow-hidden">
								<div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4">
									<h3 className="text-lg font-semibold text-white flex items-center">
										<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
										</svg>
										Hisob xavfsizligi
									</h3>
								</div>
								<div className="p-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
											<div className="flex items-center">
												<div className={`p-2 rounded-lg mr-4 bg-green-100`}>
													<svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${user.faceDetection ? 'text-green-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
												</div>
												<div>
													<h4 className="font-medium text-gray-800">Yuzni aniqlash</h4>
													<p className="text-sm text-gray-600 mt-1">
														Tizimga kirish uchun yuzingizni skanerlash mumkin
													</p>
												</div>
											</div>
											<span className={`px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800`}>
												Faol
											</span>
										</div>

										<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
											<div className="flex items-center">
												<div className={`p-2 rounded-lg mr-4 ${user.cardDetection ? 'bg-blue-100' : 'bg-gray-200'}`}>
													<svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${user.cardDetection ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
													</svg>
												</div>
												<div>
													<h4 className="font-medium text-gray-800">Karta orqali kirish</h4>
													<p className="text-sm text-gray-600 mt-1">
														{user.cardDetection ? 'ID karta orqali tizimga kirish mumkin' : "Karta orqali kirish funksiyasi o'rnatilmagan"}
													</p>
												</div>
											</div>
											<span className={`px-3 py-1 rounded-full text-sm font-medium ${user.cardDetection ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
												{user.cardDetection ? 'Faol' : 'Faol emas'}
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Qo'shimcha bo'limlar */}
							{user.bio && (
								<div className="bg-white rounded-2xl shadow-md overflow-hidden">
									<div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4">
										<h3 className="text-lg font-semibold text-white flex items-center">
											<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
												<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
											</svg>
											Qo'shimcha ma'lumot
										</h3>
									</div>
									<div className="p-6">
										<p className="text-gray-700">{user.bio}</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}

export default Profile
