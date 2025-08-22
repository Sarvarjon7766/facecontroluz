import axios from 'axios'
import { useEffect, useState } from 'react'
import {
	FaClock,
	FaEdit,
	FaFilter,
	FaRegCommentDots,
	FaUserCheck,
	FaUsers,
	FaUserSlash,
	FaUserTimes
} from 'react-icons/fa'
import {
	FiRefreshCw,
	FiSearch,
	FiX
} from 'react-icons/fi'
import { PulseLoader } from 'react-spinners'
import { toast } from 'react-toastify'

const AdminEntryExit = () => {
	const token = localStorage.getItem('token')
	const [users, setUsers] = useState([])
	const [departments, setDepartments] = useState([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedDepartment, setSelectedDepartment] = useState('all')
	const [selectedStatus, setSelectedStatus] = useState('all')
	const [commentModalOpen, setCommentModalOpen] = useState(false)
	const [timeModalOpen, setTimeModalOpen] = useState(false)
	const [modalType, setModalType] = useState('')
	const [selectedUser, setSelectedUser] = useState(null)
	const [commentText, setCommentText] = useState('')
	const [currentUserId, setCurrentUserId] = useState(null)

	const isLate = (checkInTime) => {
		if (!checkInTime) return false

		const localDate = new Date(checkInTime)
		const localHours = localDate.getHours()
		const localMinutes = localDate.getMinutes()

		const workStartHour = 9
		const workStartMinutes = 0

		const totalLocalMinutes = localHours * 60 + localMinutes
		const totalWorkStartMinutes = workStartHour * 60 + workStartMinutes

		const lateMinutes = totalLocalMinutes - totalWorkStartMinutes
		return lateMinutes > 5 ? lateMinutes : false
	}

	const formatTime = (isoString) => {
		if (!isoString) return '-'
		const date = new Date(isoString)

		const hours = date.getHours().toString().padStart(2, '0')
		const minutes = date.getMinutes().toString().padStart(2, '0')

		return `${hours}:${minutes}`
	}

	const calculateLateMinutes = (checkInTime) => {
		if (!checkInTime) return 0
		const checkInDate = new Date(checkInTime)

		const tzOffset = 5 * 60
		const localMinutes = checkInDate.getUTCHours() * 60 + checkInDate.getUTCMinutes() + tzOffset

		const workStartMinutes = 9 * 60

		const lateMinutes = localMinutes - workStartMinutes
		return lateMinutes > 0 ? lateMinutes : 0
	}

	const fetchData = async () => {
		try {
			setLoading(true)
			const [usersRes, deptRes] = await Promise.all([
				axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
					headers: { Authorization: `Bearer ${token}` },
				})
			])

			if (usersRes.data.success && deptRes.data.success) {
				const processedUsers = usersRes.data.users.map(user => {
					const isUserLate = isLate(user.firstCheckInTime)

					return {
						...user,
						attendanceStatus: user.attendanceStatus || 'kelmagan',
						entryTime: formatTime(user.lastCheckInTime) || '-',
						exitTime: formatTime(user.lastCheckOutTime) || '-',
						comment: user.lastComment || '-',
						isLate: isUserLate,
						lateMinutes: isUserLate ? calculateLateMinutes(user.firstCheckInTime) : 0,
						originalCheckInTime: user.lastCheckInTime,
						originalCheckOutTime: user.lastCheckOutTime
					}
				})

				// Daraja (lavel) bo'yicha saralash
				processedUsers.sort((a, b) => {
					if (!a.lavel && !b.lavel) return 0
					if (!a.lavel) return 1
					if (!b.lavel) return -1
					return a.lavel - b.lavel
				})

				setUsers(processedUsers)
				setDepartments(deptRes.data.departments)
			}
		} catch (error) {
			toast.error("Ma'lumotlarni yuklashda xato")
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	// Foydalanuvchi ID sini olish
	const fetchCurrentUserId = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getuserId`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				setCurrentUserId(res.data.userId)
			}
		} catch (error) {
			toast.error("Foydalanuvchi ID sini olishda xato")
		}
	}

	// Kechikkanlar sonini hisoblash
	const countLateArrivals = () => {
		return users.filter(user => user.isLate).length
	}

	// Statistikani hisoblash
	const calculateStats = () => {
		const totalUsers = users.length
		const ishdaCount = users.filter(u => u.attendanceStatus === 'ishda').length
		const tashqaridaCount = users.filter(u => u.attendanceStatus === 'tashqarida').length
		const kelmaganCount = users.filter(u =>
			u.attendanceStatus === 'kelmagan' || !['ishda', 'tashqarida'].includes(u.attendanceStatus)
		).length
		const kechikkanCount = countLateArrivals()

		return {
			total: totalUsers,
			ishda: {
				count: ishdaCount,
				percentage: totalUsers > 0 ? Math.round((ishdaCount / totalUsers) * 100) : 0
			},
			tashqarida: {
				count: tashqaridaCount,
				percentage: totalUsers > 0 ? Math.round((tashqaridaCount / totalUsers) * 100) : 0
			},
			kelmagan: {
				count: kelmaganCount,
				percentage: totalUsers > 0 ? Math.round((kelmaganCount / totalUsers) * 100) : 0
			},
			kechikkan: {
				count: kechikkanCount,
				percentage: totalUsers > 0 ? Math.round((kechikkanCount / totalUsers) * 100) : 0
			}
		}
	}

	const stats = calculateStats()

	// Status funksiyalari
	const getStatusIcon = (status) => {
		switch (status) {
			case 'ishda': return <FaUserCheck className="text-emerald-500" />
			case 'kelmagan': return <FaUserTimes className="text-rose-500" />
			case 'tashqarida': return <FaUserSlash className="text-blue-500" />
			default: return <FaUserTimes className="text-rose-500" />
		}
	}

	const getStatusColor = (status) => {
		switch (status) {
			case 'ishda': return 'bg-emerald-100 text-emerald-800'
			case 'kelmagan': return 'bg-rose-100 text-rose-800'
			case 'tashqarida': return 'bg-blue-100 text-blue-800'
			default: return 'bg-rose-100 text-rose-800'
		}
	}

	const getStatusText = (status) => {
		switch (status) {
			case 'ishda': return 'Ishda'
			case 'kelmagan': return 'Kelmadi'
			case 'tashqarida': return 'Tashqarida'
			default: return 'Kelmadi'
		}
	}

	// Kommentariya funksiyalari
	const openCommentModal = (user) => {
		setSelectedUser(user)
		setCommentText(user.comment || '')
		setCommentModalOpen(true)
	}

	const handleCommentSubmit = async () => {
		try {
			const res = await axios.put(
				`${import.meta.env.VITE_BASE_URL}/api/user/comment/${selectedUser.lastLogId}`,
				{ comment: commentText },
				{ headers: { Authorization: `Bearer ${token}` } }
			)
			if (res.data.success) {
				toast.success("Komentariya saqlandi!")
				fetchData()
				setCommentModalOpen(false)
			}
		} catch (error) {
			toast.error("Komentariyani saqlashda xatolik")
		}
	}

	// Vaqtni tahrirlash funksiyalari
	const openTimeModal = (user, type) => {
		setSelectedUser(user)
		setModalType(type)
		setTimeModalOpen(true)
	}

	const handleTimeSubmit = async () => {
		try {
			const res = await axios.put(
				`${import.meta.env.VITE_BASE_URL}/api/user/user-time/${selectedUser.hodimID}`,
				{
					qayer: '3',
					type: modalType,
					userId: selectedUser._id
				},
				{ headers: { Authorization: `Bearer ${token}` } }
			)

			if (res.data.success) {
				toast.success(
					modalType === "entry"
						? "Xodim muvaffaqiyatli kiritildi!"
						: "Xodim muvaffaqiyatli chiqarildi!"
				)
				fetchData()
				setTimeModalOpen(false)
			}
		} catch (error) {
			toast.error(error.message)
		}
	}

	// Statistik kartani bosganda filter qo'llash
	const handleStatCardClick = (status) => {
		setSelectedStatus(status)
	}

	// Foydalanuvchilarni filtrlash
	const filteredUsers = users.filter(user => {
		const matchesSearch =
			user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.hodimID?.toLowerCase().includes(searchTerm.toLowerCase())

		const matchesDepartment =
			selectedDepartment === 'all' ||
			(selectedDepartment === 'no-dept' && !user.department) ||
			user.department?._id === selectedDepartment

		const matchesStatus =
			selectedStatus === 'all' ||
			user.attendanceStatus === selectedStatus ||
			(selectedStatus === 'kelmagan' && !['ishda', 'tashqarida'].includes(user.attendanceStatus))

		return matchesSearch && matchesDepartment && matchesStatus
	})

	useEffect(() => {
		fetchCurrentUserId()
		fetchData()
	}, [])

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			{/* Sarlavha va Filtrlash */}
			<div className="bg-white rounded-xl shadow p-4 mb-6">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<h1 className="text-2xl font-bold text-indigo-600 flex items-center">
						<FaUsers className="text-indigo-500 mr-2" />
						Xodimlar Davomati
					</h1>

					<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
						<div className="relative w-full sm:w-auto sm:flex-1 min-w-[180px]">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
								<FiSearch />
							</div>
							<input
								type="text"
								placeholder="Xodimlarni qidirish..."
								className="pl-10 pr-4 py-2 text-sm w-full border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>

						<div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg w-full sm:w-auto min-w-[150px]">
							<FaFilter className="text-gray-500 flex-shrink-0" />
							<select
								className="bg-transparent text-gray-800 border-none focus:outline-none focus:ring-0 text-sm w-full"
								value={selectedDepartment}
								onChange={(e) => setSelectedDepartment(e.target.value)}
							>
								<option value="all">Barcha boʻlimlar</option>
								{departments.map(dept => (
									<option key={dept._id} value={dept._id}>{dept.name}</option>
								))}
								<option value="no-dept">Boʻlimsiz</option>
							</select>
						</div>

						<div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg w-full sm:w-auto min-w-[150px]">
							<FaFilter className="text-gray-500 flex-shrink-0" />
							<select
								className="bg-transparent text-gray-800 border-none focus:outline-none focus:ring-0 text-sm w-full"
								value={selectedStatus}
								onChange={(e) => setSelectedStatus(e.target.value)}
							>
								<option value="all">Barcha holatlar</option>
								<option value="ishda">Ishda</option>
								<option value="kelmagan">Kelmagan</option>
								<option value="tashqarida">Tashqarida</option>
							</select>
						</div>

						<button
							onClick={() => {
								setRefreshing(true)
								fetchData()
							}}
							disabled={refreshing}
							className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm w-full sm:w-auto transition-colors"
							title="Yangilash"
						>
							{refreshing ? (
								<PulseLoader size={6} color="white" />
							) : (
								<>
									<FiRefreshCw size={14} className="animate-spin" />
									<span>Yangilash</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Statistikalar */}
			<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
				{/* Ishda bo'lganlar */}
				<div
					className="bg-white rounded-lg shadow p-4 flex items-center hover:shadow-md transition-shadow cursor-pointer"
					onClick={() => handleStatCardClick('ishda')}
				>
					<div className="relative w-16 h-16 mr-4">
						<svg className="w-full h-full" viewBox="0 0 36 36">
							<path
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								fill="none"
								stroke="#e6e6e6"
								strokeWidth="3"
							/>
							<path
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								fill="none"
								stroke="#10B981"
								strokeWidth="3"
								strokeDasharray={`${stats.ishda.percentage}, 100`}
							/>
						</svg>
						<div className="absolute inset-0 flex items-center justify-center">
							<FaUserCheck className="text-emerald-500" size={20} />
						</div>
					</div>
					<div>
						<p className="text-sm font-medium text-gray-500">Ishda</p>
						<p className="text-xl font-bold text-emerald-600">
							{stats.ishda.count} <span className="text-sm font-normal">({stats.ishda.percentage}%)</span>
						</p>
					</div>
				</div>

				{/* Kelmaganlar */}
				<div
					className="bg-white rounded-lg shadow p-4 flex items-center hover:shadow-md transition-shadow cursor-pointer"
					onClick={() => handleStatCardClick('kelmagan')}
				>
					<div className="relative w-16 h-16 mr-4">
						<svg className="w-full h-full" viewBox="0 0 36 36">
							<path
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								fill="none"
								stroke="#e6e6e6"
								strokeWidth="3"
							/>
							<path
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								fill="none"
								stroke="#EF4444"
								strokeWidth="3"
								strokeDasharray={`${stats.kelmagan.percentage}, 100`}
							/>
						</svg>
						<div className="absolute inset-0 flex items-center justify-center">
							<FaUserTimes className="text-rose-500" size={20} />
						</div>
					</div>
					<div>
						<p className="text-sm font-medium text-gray-500">Kelmagan</p>
						<p className="text-xl font-bold text-rose-600">
							{stats.kelmagan.count} <span className="text-sm font-normal">({stats.kelmagan.percentage}%)</span>
						</p>
					</div>
				</div>

				{/* Tashqarida bo'lganlar */}
				<div
					className="bg-white rounded-lg shadow p-4 flex items-center hover:shadow-md transition-shadow cursor-pointer"
					onClick={() => handleStatCardClick('tashqarida')}
				>
					<div className="relative w-16 h-16 mr-4">
						<svg className="w-full h-full" viewBox="0 0 36 36">
							<path
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								fill="none"
								stroke="#e6e6e6"
								strokeWidth="3"
							/>
							<path
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								fill="none"
								stroke="#3B82F6"
								strokeWidth="3"
								strokeDasharray={`${stats.tashqarida.percentage}, 100`}
							/>
						</svg>
						<div className="absolute inset-0 flex items-center justify-center">
							<FaUserSlash className="text-blue-500" size={20} />
						</div>
					</div>
					<div>
						<p className="text-sm font-medium text-gray-500">Tashqarida</p>
						<p className="text-xl font-bold text-blue-600">
							{stats.tashqarida.count} <span className="text-sm font-normal">({stats.tashqarida.percentage}%)</span>
						</p>
					</div>
				</div>

				{/* Kechikkanlar */}
				<div
					className="bg-white rounded-lg shadow p-4 flex items-center hover:shadow-md transition-shadow cursor-pointer"
					onClick={() => {
						setSelectedStatus('ishda')
						// Kechikkanlar faqat ishda bo'lganlar orasidan topiladi
					}}
				>
					<div className="relative w-16 h-16 mr-4">
						<svg className="w-full h-full" viewBox="0 0 36 36">
							<path
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								fill="none"
								stroke="#e6e6e6"
								strokeWidth="3"
							/>
							<path
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								fill="none"
								stroke="#F59E0B"
								strokeWidth="3"
								strokeDasharray={`${stats.kechikkan.percentage}, 100`}
							/>
						</svg>
						<div className="absolute inset-0 flex items-center justify-center">
							<FaClock className="text-yellow-500" size={20} />
						</div>
					</div>
					<div>
						<p className="text-sm font-medium text-gray-500">Kechikkan</p>
						<p className="text-xl font-bold text-yellow-600">
							{stats.kechikkan.count} <span className="text-sm font-normal">({stats.kechikkan.percentage}%)</span>
						</p>
					</div>
				</div>
			</div>

			{/* Xodimlar Jadvali */}
			<div className="bg-white rounded-xl shadow overflow-hidden">
				{loading ? (
					<div className="flex justify-center items-center h-64">
						<PulseLoader color="#6366F1" size={15} />
					</div>
				) : filteredUsers.length === 0 ? (
					<div className="text-center py-12">
						<div className="mx-auto h-24 w-24 text-gray-400 mb-4">
							<FaUserTimes className="w-full h-full" />
						</div>
						<h3 className="text-lg font-medium text-gray-900">Xodimlar topilmadi</h3>
						<p className="text-sm text-gray-500 mt-1">
							{searchTerm ? "Qidiruv bo'yicha xodim topilmadi" : "Tizimda xodimlar mavjud emas"}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">№</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Xodim</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Lavozim</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Boʻlim</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Telefon</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Kirish</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Chiqish</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Izoh</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Holat</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredUsers.map((user, index) => (
									<tr key={user._id} className={`
                    hover:bg-opacity-90 transition-colors
                    ${!user.attendanceStatus || user.attendanceStatus === 'kelmagan'
											? 'bg-red-50 hover:bg-red-100'
											: user.attendanceStatus === 'ishda'
												? 'bg-green-50 hover:bg-green-100'
												: 'bg-blue-50 hover:bg-blue-100'
										}
                  `}>
										<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
											<div className="flex items-center">
												{index + 1}
												{user.isLate && (
													<span className="ml-2 text-yellow-500" title={`${user.lateMinutes} daqiqa kechikkan`}>
														<FaClock className="inline" size={12} />
													</span>
												)}
											</div>
										</td>
										<td className="px-4 py-4">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
													{user.photo ? (
														<img
															src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
															alt={user.fullName}
															className="h-full w-full rounded-full object-cover"
														/>
													) : (
														user.fullName?.charAt(0)?.toUpperCase()
													)}
												</div>
												<div className="ml-3">
													<p className="text-sm font-medium text-gray-900">
														{user.fullName}
													</p>
													<p className="text-xs text-gray-500">{user.hodimID}</p>
												</div>
											</div>
										</td>
										<td className="px-4 py-4 text-sm text-gray-900">
											{user.position || '-'}
										</td>
										<td className="px-4 py-4 text-sm text-gray-900">
											{user.department?.name || "Boʻlimsiz"}
										</td>
										<td className="px-4 py-4 text-sm text-gray-900">
											{user.phone_personal || user.phone_work
												? `${user.phone_personal || ''}${user.phone_personal && user.phone_work ? ' (' : ''}${user.phone_work || ''}${user.phone_personal && user.phone_work ? ')' : ''}`
												: '-'}
										</td>
										{/* Kirish vaqti */}
										<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
											<div className="flex items-center gap-1">
												<span>{user.entryTime}</span>
												{(!user.lastCheckInTime || (user.lastCheckInTime && user.lastCheckOutTime)) && (
													<button
														onClick={() => openTimeModal(user, 'entry')}
														className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
														title="Kirish vaqtini qo'shish/tahrirlash"
													>
														<FaEdit size={12} />
													</button>
												)}
											</div>
										</td>

										{/* Chiqish vaqti */}
										<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
											<div className="flex items-center gap-1">
												<span>{user.exitTime}</span>
												{user.lastCheckInTime && !user.lastCheckOutTime && (
													<button
														onClick={() => openTimeModal(user, 'exit')}
														className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
														title="Chiqish vaqtini qo'shish"
													>
														<FaEdit size={12} />
													</button>
												)}
											</div>
										</td>

										{/* Kommentariya */}
										<td className="px-4 py-4 text-sm text-gray-900 whitespace-normal break-words max-w-xs">
											<div className="flex items-center gap-1">
												<span>{user.comment}</span>
												{user.lastCheckInTime && !user.lastCheckOutTime && (
													<button
														onClick={() => openCommentModal(user)}
														className="p-1 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
														title="Komentariya qo'shish"
													>
														<FaRegCommentDots size={12} />
													</button>
												)}
											</div>
										</td>
										<td className="px-4 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.attendanceStatus)}`}>
													{getStatusIcon(user.attendanceStatus)}
													<span className="ml-1.5">
														{getStatusText(user.attendanceStatus)}
													</span>
												</span>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Kommentariya Modali */}
			{commentModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="fixed inset-0  backdrop-blur-sm transition-opacity" onClick={() => setCommentModalOpen(false)}></div>
					<div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10 transform transition-all">
						<div className="p-6">
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-xl font-bold text-gray-800">
									<FaRegCommentDots className="inline mr-2 text-indigo-500" />
									{selectedUser?.fullName} uchun izoh
								</h3>
								<button
									onClick={() => setCommentModalOpen(false)}
									className="text-gray-500 hover:text-gray-700 transition-colors"
								>
									<FiX size={24} />
								</button>
							</div>
							<div className="mb-6">
								<textarea
									className="w-full p-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									rows={4}
									value={commentText}
									onChange={(e) => setCommentText(e.target.value)}
									placeholder="Izoh yozing..."
								/>
							</div>
							<div className="flex justify-end gap-3">
								<button
									className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
									onClick={() => setCommentModalOpen(false)}
								>
									Bekor qilish
								</button>
								<button
									className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
									onClick={handleCommentSubmit}
								>
									<FaRegCommentDots size={14} />
									Saqlash
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Xodimni Kiritish/Chiqarish Modali */}
			{timeModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="fixed inset-0 backdrop-blur-sm transition-opacity"
						onClick={() => setTimeModalOpen(false)}
					></div>
					<div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10 transform transition-all">
						<div className="p-6">
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-xl font-bold text-gray-800">
									<FaClock className="inline mr-2 text-blue-500" />
									{selectedUser?.fullName} uchun{" "}
									{modalType === "entry" ? "Kirish" : "Chiqish"}
								</h3>
								<button
									onClick={() => setTimeModalOpen(false)}
									className="text-gray-500 hover:text-gray-700 transition-colors"
								>
									<FiX size={24} />
								</button>
							</div>

							<div className="mb-6 text-sm text-gray-700">
								Ushbu amalni tasdiqlashni xohlaysizmi?
							</div>

							<div className="flex justify-end gap-3">
								<button
									className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
									onClick={() => setTimeModalOpen(false)}
								>
									Bekor qilish
								</button>
								<button
									className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
									onClick={handleTimeSubmit}
								>
									<FaEdit size={14} />
									{modalType === "entry" ? "Xodimni kiritish" : "Xodimni chiqarish"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default AdminEntryExit