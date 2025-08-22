import axios from 'axios'
import { useEffect, useState } from 'react'
import { FiLogOut, FiMenu, FiPhone, FiUser, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

const AdminNavbar = ({ onMenuToggle }) => {
	const navigate = useNavigate()
	const [showProfileMenu, setShowProfileMenu] = useState(false)
	const [showBillMenu, setShowBillMenu] = useState(false)
	const [user, setUser] = useState({})
	const token = localStorage.getItem('token')
	const [billNotification, setBillNotification] = useState([])
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				setShowProfileMenu(false)
				setShowBillMenu(false)
			}
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const fetchData = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getUser`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (res.data.success) {
				setUser(res.data.user)
			}
		} catch (error) {
			console.error('Error while fetching user:', error)
		}
	}

	useEffect(() => {
		fetchData()
	}, [token])

	const handleLogout = () => {
		navigate('/logout')
	}

	const handleProfile = () => {
		navigate('/admin/profile')
		setShowProfileMenu(false)
	}

	const formatDate = (dateString) => {
		const options = { month: 'long', day: 'numeric' }
		return new Date(dateString).toLocaleDateString('uz-UZ', options)
	}

	const toggleBillMenu = () => {
		setShowBillMenu(!showBillMenu)
		if (isMobile && showProfileMenu) {
			setShowProfileMenu(false)
		}
	}

	const toggleProfileMenu = () => {
		setShowProfileMenu(!showProfileMenu)
		if (isMobile && showBillMenu) {
			setShowBillMenu(false)
		}
	}

	return (
		<>
			<div className="md:hidden bg-blue-800 text-white sticky top-0 z-50 py-3 px-4 flex items-center justify-between shadow-lg">
				<button
					className="text-white hover:bg-blue-700 p-2 rounded-lg focus:outline-none transition-all duration-200"
					onClick={onMenuToggle}
					aria-label="Toggle menu"
				>
					<FiMenu size={24} />
				</button>

				<div className="flex items-center space-x-4">


					<button
						onClick={toggleProfileMenu}
						className="p-2 text-white hover:bg-blue-700 rounded-lg relative transition-all duration-200"
						aria-label="Profile"
					>
						<FiUser size={20} />
					</button>
				</div>
			</div>
			<nav className="hidden md:flex bg-blue-800 text-white shadow-lg sticky top-0 z-50">
				<div className="w-full max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
					<div className="flex items-center">
						<h1 className="text-xl font-bold text-blue-100"></h1>
					</div>

					<div className="flex items-center space-x-6">
						<div className="relative">
						</div>

						<div className="relative">
							<button
								className="flex items-center space-x-3 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all duration-200 group"
								onClick={toggleProfileMenu}
								aria-label="User menu"
							>
								<div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-400 group-hover:border-blue-300 transition-all overflow-hidden">
									{user?.photo ? (
										<img
											src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
											alt={user.fullName}
											className="w-full h-full object-cover"
										/>
									) : (
										<FiUser size={18} className="text-blue-100" />
									)}
								</div>

								<div className="text-left">
									<p className="font-medium text-white">{user.fullName || 'Foydalanuvchi'}</p>
									<p className="text-xs text-blue-200">{user.position || 'Lavozim'}</p>
								</div>
							</button>

							{showProfileMenu && (
								<div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-200">
									<div className="px-4 py-3 border-b border-gray-100 bg-blue-50 rounded-t-xl flex justify-between items-center">
										<div>
											<p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
											<p className="text-xs text-gray-600">{user.position}</p>
										</div>
										<button
											onClick={() => setShowProfileMenu(false)}
											className="text-gray-500 hover:text-gray-700"
										>
											<FiX size={18} />
										</button>
									</div>
									<button
										onClick={handleProfile}
										className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 flex items-center"
									>
										<FiUser className="mr-3 text-blue-500" />
										Profil
									</button>
									<div className="border-t border-gray-100 mx-3"></div>
									<button
										onClick={handleLogout}
										className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center"
									>
										<FiLogOut className="mr-3" />
										Chiqish
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</nav>

			{isMobile && (
				<>
					{showBillMenu && (
						<div className="fixed inset-0 z-40 blackdrop-blur flex justify-end">
							<div className="bg-white w-4/5 max-w-sm h-full overflow-y-auto">
								<div className="p-4 border-b border-gray-200 bg-blue-50 flex justify-between items-center">
									<h2 className="font-semibold text-gray-800">Bugun tug'ilgan kunlar</h2>
									<button
										onClick={() => setShowBillMenu(false)}
										className="text-gray-500 hover:text-gray-700"
									>
										<FiX size={24} />
									</button>
								</div>
								<div className="divide-y divide-gray-100">
									{billNotification.length > 0 ? (
										billNotification.map((item) => (
											<div key={item._id} className="p-4 hover:bg-blue-50">
												<div className="flex items-start">
													<div className="p-2 bg-pink-50 rounded-lg text-pink-500 mr-3">
														<FiPhone size={18} />
													</div>
													<div>
														<p className="font-medium text-gray-800">{item.fullName}</p>
														<p className="text-sm text-gray-500">{item.position}</p>
														<p className="text-sm text-pink-500 mt-1">
															Bugun tug'ilgan kuni
														</p>
													</div>
												</div>
											</div>
										))
									) : (
										<div className="p-4 text-center text-gray-500">
											Bugun tug'ilgan kunlar mavjud emas
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					{showProfileMenu && (
						<div className="fixed inset-0 z-40 blackdrop-blur flex justify-end">
							<div className="bg-white w-4/5 max-w-sm h-full overflow-y-auto">
								<div className="p-4 border-b border-gray-200 bg-blue-50 flex justify-between items-center">
									<div>
										<h2 className="font-semibold text-gray-800">{user.fullName}</h2>
										<p className="text-sm text-gray-600">{user.position}</p>
									</div>
									<button
										onClick={() => setShowProfileMenu(false)}
										className="text-gray-500 hover:text-gray-700"
									>
										<FiX size={24} />
									</button>
								</div>
								<div className="divide-y divide-gray-100">
									<button
										onClick={handleProfile}
										className="w-full text-left p-4 hover:bg-blue-50 flex items-center"
									>
										<FiUser className="mr-3 text-blue-500" size={18} />
										<span className="text-gray-700">Profil</span>
									</button>
									<button
										onClick={handleLogout}
										className="w-full text-left p-4 hover:bg-red-50 flex items-center"
									>
										<FiLogOut className="mr-3 text-red-500" size={18} />
										<span className="text-red-600">Chiqish</span>
									</button>
								</div>
							</div>
						</div>
					)}
				</>
			)}
		</>
	)
}

export default AdminNavbar