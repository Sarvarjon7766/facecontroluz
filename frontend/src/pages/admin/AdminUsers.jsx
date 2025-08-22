import axios from 'axios'
import { useEffect, useState } from 'react'
import { FiDownload, FiEdit, FiFilter, FiPlus, FiSearch } from 'react-icons/fi'
import { ToastContainer, toast } from 'react-toastify'
import * as XLSX from "xlsx-js-style"
import AdminUserAdd from './AdminUserAdd'
import AdminUserUpdate from './AdminUserUpdate'

const AdminUsers = () => {
	const token = localStorage.getItem('token')
	const [departments, setDepartments] = useState([])
	const [selectedDepartment, setSelectedDepartment] = useState('all')
	const [users, setUsers] = useState([])
	const [filteredUsers, setFilteredUsers] = useState([])
	const [searchTerm, setSearchTerm] = useState('')
	const [commentModalOpen, setCommentModalOpen] = useState(false)
	const [selectedUser, setSelectedUser] = useState(null)
	const [addUser, setAddUser] = useState(false)
	const [updateUser, setUpdateUser] = useState(false)
	const [commentText, setCommentText] = useState('')
	const [exportLoading, setExportLoading] = useState(false)

	// API Calls
	const fetchDepartments = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				setDepartments(res.data.departments)
			}
		} catch (error) {
			toast.error('Boʻlimlarni yuklashda xatolik')
		}
	}

	const fetchUsers = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				const sortedUsers = [...res.data.users].sort((a, b) => a.lavel - b.lavel)
				setUsers(sortedUsers)
				setFilteredUsers(sortedUsers)
			}
		} catch (error) {
			toast.error('Foydalanuvchilarni yuklashda xatolik')
		}
	}

	useEffect(() => {
		fetchDepartments()
		fetchUsers()
	}, [])

	useEffect(() => {
		filterUsers()
	}, [selectedDepartment, searchTerm, users])

	// Statistikani hisoblash
	const calculateStats = () => {
		const totalUsers = users.length
		const ishdaCount = users.filter(u => u.attendanceStatus === 'ishda').length
		const tashqaridaCount = users.filter(u => u.attendanceStatus === 'tashqarida').length
		const kelmaganCount = users.filter(u => u.attendanceStatus === 'kelmagan').length

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
			}
		}
	}
	const stats = calculateStats()
	// Helper Functions
	const filterUsers = () => {
		let result = [...users]
		if (selectedDepartment !== 'all') {
			result = result.filter(user =>
				user.department && user.department._id === selectedDepartment
			)
		}
		if (searchTerm) {
			const term = searchTerm.toLowerCase()
			result = result.filter(user =>
				user.fullName.toLowerCase().includes(term) ||
				user.position.toLowerCase().includes(term) ||
				user.username.toLowerCase().includes(term))
		}
		setFilteredUsers(result)
	}

	const openEditModal = (user) => {
		setSelectedUser(user)
		setUpdateUser(true)
	}

	const handleClose = () => {
		setAddUser(false)
		setUpdateUser(false)
		fetchUsers()
	}

	const getStatusClass = (status) => {
		switch (status) {
			case 'kelmagan': return 'bg-red-100 text-red-800'
			case 'tashqarida': return 'bg-yellow-100 text-yellow-800'
			case 'ishda': return 'bg-green-100 text-green-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	const getStatusText = (status) => {
		switch (status) {
			case 'kelmagan': return 'Kelmagan'
			case 'tashqarida': return 'Tashqarida'
			case 'ishda': return 'Ishda'
			default: return 'Nomaʼlum'
		}
	}



	const exportUsersToExcel = async () => {
		setExportLoading(true)
		try {
			const exportData = users.map((user, index) => ({
				'№': index + 1,
				'F.I.Sh': user.fullName,
				'Lavozim': user.position,
				'Boʻlim': user.department ? user.department.name : "Bo'limsiz",
				'Hodim ID': user.hodimID || 'Mavjud emas',
				'Foydalanuvchi nomi': user.username,
				'Shaxsiy telefon': user.phone_personal || 'Mavjud emas',
				'Ish telefon': user.phone_work || 'Mavjud emas',
				'Holati': getStatusText(user.attendanceStatus || 'Nomaʼlum'),
				'Tartib raqam': user.lavel || '',
				'Yaratilgan sana': new Date(user.createdAt).toLocaleDateString('uz-UZ'),
				'Oxirgi tahrir': user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('uz-UZ') : 'Mavjud emas',
				'Komentariya': user.comment || ''
			}))

			const ws = XLSX.utils.json_to_sheet(exportData)

			// ustun kengliklari
			ws['!cols'] = [
				{ wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
				{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
				{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
			]

			// header (birinchi qator) uchun style
			const headerStyle = {
				font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
				fill: { fgColor: { rgb: "4F81BD" } },
				alignment: { horizontal: "center", vertical: "center" },
				border: {
					top: { style: "thin", color: { rgb: "000000" } },
					bottom: { style: "thin", color: { rgb: "000000" } },
					left: { style: "thin", color: { rgb: "000000" } },
					right: { style: "thin", color: { rgb: "000000" } }
				}
			}

			// oddiy kataklar uchun style
			const cellStyle = {
				alignment: { horizontal: "center", vertical: "center", wrapText: true },
				border: {
					top: { style: "thin", color: { rgb: "CCCCCC" } },
					bottom: { style: "thin", color: { rgb: "CCCCCC" } },
					left: { style: "thin", color: { rgb: "CCCCCC" } },
					right: { style: "thin", color: { rgb: "CCCCCC" } }
				}
			}

			// barcha qatorlarni style bilan o‘rash
			const range = XLSX.utils.decode_range(ws['!ref'])
			for (let R = range.s.r; R <= range.e.r; ++R) {
				for (let C = range.s.c; C <= range.e.c; ++C) {
					const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
					if (!ws[cellRef]) continue

					if (R === 0) {
						// header
						ws[cellRef].s = headerStyle
					} else {
						// oddiy katak
						ws[cellRef].s = cellStyle
					}
				}
			}

			// workbook yaratish
			const wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, "Xodimlar")

			// fayl nomi
			const fileName = `xodimlar_${new Date().toISOString().slice(0, 10)}.xlsx`
			XLSX.writeFile(wb, fileName)

			toast.success("Excel fayliga chiroyli dizayn bilan yuklandi!")
		} catch (error) {
			toast.error("Export qilishda xatolik")
			console.error("Excel export error:", error)
		} finally {
			setExportLoading(false)
		}
	}


	return (
		<div className="p-4 md:p-6 bg-gray-50 min-h-screen">
			<ToastContainer position="top-right" autoClose={5000} />

			<div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-gray-100">
				<div className="flex items-center justify-between mb-5">
					<h3 className="text-lg font-semibold text-indigo-700 flex items-center">
						<svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
						Xodimlar statistikasi
					</h3>
					<span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
						Jami: {stats.total} xodim
					</span>
				</div>

				<div className="grid grid-cols-3 gap-6 text-center">
					{/* Ishda */}
					<div className="flex flex-col items-center">
						<div className="relative w-20 h-20">
							<svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
								<path
									d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
									fill="none"
									stroke="#E5F7F0"
									strokeWidth="3"
								/>
								<path
									d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
									fill="none"
									stroke="#10B981"
									strokeWidth="3"
									strokeDasharray={`${stats.ishda.percentage}, 100`}
									strokeLinecap="round"
								/>
							</svg>
							<div className="absolute inset-0 flex items-center justify-center">
								<span className="text-sm font-bold text-green-600">{stats.ishda.percentage}%</span>
							</div>
						</div>
						<p className="mt-2 text-green-700 font-medium text-sm">Ishda</p>
						<p className="text-xs text-green-600">{stats.ishda.count} / {stats.total}</p>
					</div>

					{/* Tashqarida */}
					<div className="flex flex-col items-center">
						<div className="relative w-20 h-20">
							<svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
								<path
									d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
									fill="none"
									stroke="#FEF3E7"
									strokeWidth="3"
								/>
								<path
									d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
									fill="none"
									stroke="#F59E0B"
									strokeWidth="3"
									strokeDasharray={`${stats.tashqarida.percentage}, 100`}
									strokeLinecap="round"
								/>
							</svg>
							<div className="absolute inset-0 flex items-center justify-center">
								<span className="text-sm font-bold text-amber-600">{stats.tashqarida.percentage}%</span>
							</div>
						</div>
						<p className="mt-2 text-amber-700 font-medium text-sm">Tashqarida</p>
						<p className="text-xs text-amber-600">{stats.tashqarida.count} / {stats.total}</p>
					</div>

					{/* Kelmagan */}
					<div className="flex flex-col items-center">
						<div className="relative w-20 h-20">
							<svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
								<path
									d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
									fill="none"
									stroke="#FEECEC"
									strokeWidth="3"
								/>
								<path
									d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
									fill="none"
									stroke="#EF4444"
									strokeWidth="3"
									strokeDasharray={`${stats.kelmagan.percentage}, 100`}
									strokeLinecap="round"
								/>
							</svg>
							<div className="absolute inset-0 flex items-center justify-center">
								<span className="text-sm font-bold text-red-600">{stats.kelmagan.percentage}%</span>
							</div>
						</div>
						<p className="mt-2 text-red-700 font-medium text-sm">Kelmagan</p>
						<p className="text-xs text-red-600">{stats.kelmagan.count} / {stats.total}</p>
					</div>
				</div>
			</div>


			<div className="bg-white rounded-xl shadow p-4 mb-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					{/* Qidiruv input */}
					<div className="relative w-full sm:max-w-sm">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
							<FiSearch />
						</div>
						<input
							type="text"
							placeholder="Xodimlarni qidirish..."
							className="pl-10 pr-4 py-2.5 text-black w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Filtr va tugmalar */}
					<div className="flex flex-wrap gap-2 w-full sm:w-auto">
						{/* Department select */}
						<div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg flex-1 sm:flex-none min-w-0">
							<FiFilter className="text-gray-500 shrink-0" />
							<select
								className="bg-transparent text-gray-800 border-none focus:outline-none focus:ring-0 text-sm truncate max-w-[200px] sm:max-w-[250px] md:max-w-[300px]"
								value={selectedDepartment}
								onChange={(e) => setSelectedDepartment(e.target.value)}
							>
								{departments.map(dept => (
									<option key={dept._id} value={dept._id} className="max-w-[350px] whitespace-normal break-words">
										{dept.name}
									</option>
								))}
							</select>
						</div>

						{/* Excel export */}
						<button
							onClick={exportUsersToExcel}
							disabled={exportLoading}
							className={`px-3 py-2 rounded-lg flex items-center gap-2 flex-1 sm:flex-none justify-center ${exportLoading
								? 'bg-gray-400 cursor-not-allowed'
								: 'bg-green-600 hover:bg-green-700 text-white'
								}`}
							title="Excelga yuklash"
						>
							{exportLoading ? (
								<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							) : (
								<FiDownload size={18} />
							)}
							<span className="hidden xs:inline">Excel</span>
						</button>

						{/* Yangi xodim */}
						<button
							onClick={() => setAddUser(true)}
							className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 flex-1 sm:flex-none justify-center"
							title="Yangi xodim"
						>
							<FiPlus size={18} />
							<span className="hidden xs:inline">Yangi</span>
						</button>
					</div>
				</div>
			</div>


			{/* Users Table */}
			<div className="bg-white rounded-xl shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xodim</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lavozim</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holati</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amallar</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredUsers.length > 0 ? (
								filteredUsers.map((user, index) => (
									<tr key={user._id} className="hover:bg-gray-50">
										<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
											{index + 1}
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-10 w-10">
													{user.photo ? (
														<img
															className="h-10 w-10 rounded-full object-cover"
															src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
															alt={user.fullName}
														/>
													) : (
														<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
															{user.fullName.charAt(0)}
														</div>
													)}
												</div>
												<div className="ml-3">
													<div className="text-sm font-medium text-gray-900 line-clamp-1">{user.fullName}</div>
													<div className="text-xs text-gray-500">{user.username}</div>
												</div>
											</div>
										</td>
										<td className="px-4 py-3">
											<div className="text-sm text-gray-900 line-clamp-1">{user.position}</div>
											<div className="text-xs text-gray-500">{user.hodimID}</div>
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-2">
												<span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(user.attendanceStatus)}`}>
													{getStatusText(user.attendanceStatus)}
												</span>
											</div>
										</td>
										<td className="px-4 py-3 text-right text-sm font-medium">
											<button
												onClick={() => openEditModal(user)}
												className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
											>
												<FiEdit size={18} />
											</button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
										Hech qanday xodim topilmadi
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{addUser && <AdminUserAdd onClose={handleClose} departments={departments} />}
			{updateUser && <AdminUserUpdate user={selectedUser} onClose={handleClose} departments={departments} />}
		</div>
	)
}

export default AdminUsers
