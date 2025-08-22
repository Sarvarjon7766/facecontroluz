import axios from 'axios'
import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import { saveAs } from "file-saver"
import { useEffect, useState } from 'react'
import {
	FaFileExcel,
	FaRegCalendarAlt,
	FaUserCheck,
	FaUsers,
	FaUserSlash,
	FaUserTimes
} from 'react-icons/fa'
import {
	FiChevronRight,
	FiRefreshCw,
	FiSearch
} from 'react-icons/fi'
import { PulseLoader } from 'react-spinners'
import { toast } from 'react-toastify'
import * as XLSX from "xlsx-js-style"
dayjs.extend(utc)
dayjs.extend(timezone)

import UserAttendanceModal from './UserAttendanceModal'

const AdminAttendance = () => {
	const token = localStorage.getItem('token')
	const [departments, setDepartments] = useState([])
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [refreshing, setRefreshing] = useState(false)
	const [activeTab, setActiveTab] = useState('all')
	const [selectedUserId, setSelectedUserId] = useState(null)

	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')
	const [downloadLoading, setDownloadLoading] = useState(false)

	const fetchDepartmentsWithUsers = async () => {
		try {
			setLoading(true)
			const [deptRes, usersRes] = await Promise.all([
				axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
			])

			if (deptRes.data.success && usersRes.data.success) {
				const departmentColors = [
					'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200',
					'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200',
					'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200',
					'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200',
					'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 border border-rose-200',
					'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200',
				]

				const usersWithDefaultStatus = usersRes.data.users.map(user => ({
					...user,
					attendanceStatus: user.attendanceStatus || 'kelmagan'
				}))

				const departmentsWithUsers = deptRes.data.departments.map((dept, index) => ({
					...dept,
					users: usersWithDefaultStatus.filter(user => user.department?._id === dept._id),
					badgeStyle: `${departmentColors[index % departmentColors.length]}`
				}))

				const noDeptUsers = usersWithDefaultStatus.filter(user => !user.department)
				if (noDeptUsers.length > 0) {
					departmentsWithUsers.push({
						_id: 'no-department',
						name: "Bo'limi yo'q",
						users: noDeptUsers,
						badgeStyle: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300',
					})
				}
				setDepartments(departmentsWithUsers)
			}
		} catch (error) {
			toast.error("Ma'lumotlarni yuklashda xato yuz berdi")
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}


	const handleDownload = async () => {
		if (!startDate || !endDate) {
			toast.error("Iltimos, boshlangʻich va tugash sanalarini tanlang")
			return
		}

		try {
			setDownloadLoading(true)

			const { data } = await axios.get(
				`${import.meta.env.VITE_BASE_URL}/api/user/logstatistiks`,
				{
					headers: { Authorization: `Bearer ${token}` },
					params: { startDate, endDate },
				}
			)

			if (!data.success) {
				toast.error("Statistika olishda xato")
				return
			}

			const stats = data.stats

			// 🔹 Barcha sanalarni yig'ish (endi subtract ishlatmaymiz!)
			const allDates = Array.from(
				new Set(
					stats.flatMap((s) =>
						s.details.map((d) =>
							dayjs(d.date).tz("Asia/Tashkent").format("YYYY-MM-DD")
						)
					)
				)
			).sort((a, b) => new Date(a) - new Date(b))

			// 🔹 Har bir sana uchun maksimal sessiyalar
			const maxSessionsPerDate = {}
			allDates.forEach((date) => {
				const max = Math.max(
					0,
					...stats.map((s) => {
						const day = s.details.find(
							(d) =>
								dayjs(d.date).tz("Asia/Tashkent").format("YYYY-MM-DD") === date
						)
						return day?.sessions?.length || 0
					})
				)
				maxSessionsPerDate[date] = Math.max(1, max)
			})

			// 🔹 UTC → Local vaqt aylantiruvchi funksiya
			const timeFromISO = (v) => {
				if (!v) return ""
				return dayjs(v).tz("Asia/Tashkent").format("HH:mm:ss")
			}

			// 🔹 Header (2 qatorli)
			const headerRow1 = ["T/r", "F.I.SH.", "Ish joyi va lavozimi"]
			const headerRow2 = ["", "", ""]

			allDates.forEach((date) => {
				const n = maxSessionsPerDate[date]
				for (let i = 1; i <= n; i++) {
					headerRow1.push(date, "", "")
					headerRow2.push(
						`Kelgan vaqti ${i}`,
						`Ketgan vaqti ${i}`,
						`Davomiyligi ${i}`
					)
				}
			})

			headerRow1.push("Umumiy ish soati")
			headerRow2.push("")

			// 🔹 Maʼlumot qatorlari
			const rows = stats.map((stat, idx) => {
				const row = [idx + 1, stat.user, stat.position || ""]
				let totalHours = 0

				allDates.forEach((date) => {
					const day = stat.details.find(
						(d) => dayjs(d.date).tz("Asia/Tashkent").format("YYYY-MM-DD") === date
					)
					const sessions = day?.sessions || []
					const maxN = maxSessionsPerDate[date]

					for (let i = 0; i < maxN; i++) {
						const s = sessions[i]
						if (s) {
							row.push(
								timeFromISO(s.checkIn),
								timeFromISO(s.checkOut),
								s.duration ?? ""
							)
							if (s.duration) totalHours += Number(s.duration)
						} else {
							row.push("-", "-", "-")
						}
					}
				})

				row.push(totalHours.toFixed(2))
				return row
			})

			// 🔹 Worksheet yaratish
			const wsData = [headerRow1, headerRow2, ...rows]
			const ws = XLSX.utils.aoa_to_sheet(wsData)

			// 🔹 Merges (sana guruhlari uchun)
			const merges = []
			let c = 3
			allDates.forEach((date) => {
				const width = maxSessionsPerDate[date] * 3
				merges.push({ s: { r: 0, c }, e: { r: 0, c: c + width - 1 } })
				c += width
			})
			ws["!merges"] = merges

			// 🔹 Column widths
			ws["!cols"] = [
				{ wch: 6 },
				{ wch: 25 },
				{ wch: 30 },
				...allDates.flatMap((date) =>
					Array(maxSessionsPerDate[date] * 3).fill({ wch: 14 })
				),
				{ wch: 18 },
			]

			// 🔹 Style qoʻllash (headerga bg-blue va bold text)
			const range = XLSX.utils.decode_range(ws["!ref"])
			for (let C = range.s.c; C <= range.e.c; ++C) {
				for (let R = 0; R <= 1; ++R) {
					const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
					if (ws[cellAddress]) {
						ws[cellAddress].s = {
							font: { bold: true, color: { rgb: "FFFFFF" } },
							fill: { fgColor: { rgb: "2563EB" } },
							alignment: {
								horizontal: "center",
								vertical: "center",
								wrapText: true,
							},
							border: {
								top: { style: "thin", color: { rgb: "000000" } },
								bottom: { style: "thin", color: { rgb: "000000" } },
								left: { style: "thin", color: { rgb: "000000" } },
								right: { style: "thin", color: { rgb: "000000" } },
							},
						}
					}
				}
			}

			// 🔹 F.I.SH ustunini qalin qilish
			for (let R = 2; R <= range.e.r; ++R) {
				const cellAddress = XLSX.utils.encode_cell({ r: R, c: 1 })
				if (ws[cellAddress]) {
					ws[cellAddress].s = {
						font: { bold: true },
						alignment: { wrapText: true, vertical: "center" },
					}
				}
			}

			// 🔹 Workbook
			const wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, "Davomat")

			const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
			saveAs(
				new Blob([wbout], { type: "application/octet-stream" }),
				`Davomat_${startDate}_${endDate}.xlsx`
			)

			toast.success("Fayl muvaffaqiyatli yuklab olindi")
		} catch (error) {
			toast.error("Yuklab olishda xato yuz berdi")
		} finally {
			setDownloadLoading(false)
		}
	}






	const getStatusIcon = (status) => {
		switch (status) {
			case 'ishda':
				return <FaUserCheck className="text-emerald-500" />
			case 'kelmagan':
				return <FaUserTimes className="text-rose-500" />
			case 'tashqarida':
				return <FaUserSlash className="text-blue-500" />
			default:
				return <FaUserTimes className="text-rose-500" />
		}
	}

	const getStatusColor = (status) => {
		switch (status) {
			case 'ishda':
				return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 shadow-emerald-100/50'
			case 'kelmagan':
				return 'bg-gradient-to-r from-rose-100 to-rose-200 text-rose-800 shadow-rose-100/50'
			case 'tashqarida':
				return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-blue-100/50'
			default:
				return 'bg-gradient-to-r from-rose-100 to-rose-200 text-rose-800 shadow-rose-100/50'
		}
	}

	const getStatusText = (status) => {
		switch (status) {
			case 'ishda':
				return 'Ishda'
			case 'kelmagan':
				return 'Kelmadi'
			case 'tashqarida':
				return 'Tashqarida'
			default:
				return 'Kelmadi'
		}
	}

	const UserAvatar = ({ user }) => {
		return (
			<div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
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
		)
	}

	const filteredDepartments = departments
		.map(dept => ({
			...dept,
			users: dept.users.filter(user => {
				const matchesSearch =
					user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					user.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					user.username?.toLowerCase().includes(searchTerm.toLowerCase())

				const matchesTab =
					activeTab === 'all' ||
					(activeTab === 'ishda' && user.attendanceStatus === 'ishda') ||
					(activeTab === 'kelmagan' &&
						(user.attendanceStatus === 'kelmagan' ||
							!['ishda', 'tashqarida'].includes(user.attendanceStatus))) ||
					(activeTab === 'tashqarida' && user.attendanceStatus === 'tashqarida')

				return matchesSearch && matchesTab
			}),
		}))
		.filter(dept => dept.users.length > 0)


	useEffect(() => {
		fetchDepartmentsWithUsers()
	}, [])

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
			{/* Header */}
			<header className="bg-white shadow-lg">
				<div className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold text-gray-900 flex items-center">
								<span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
									Davomat Monitoringi
								</span>
								<span className="ml-3 text-xs bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 px-3 py-1 rounded-full shadow-sm">
									Real-time
								</span>
							</h1>
						</div>

						<div className="flex items-center space-x-3 w-full md:w-auto">
							<div className="relative rounded-full shadow-sm w-full md:w-72">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FiSearch className="h-4 w-4 text-gray-400" />
								</div>
								<input
									type="text"
									className="block w-full pl-10 pr-3 text-black py-2.5 text-sm border-gray-300 rounded-full border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
									placeholder="Xodimni qidirish..."
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
								/>
							</div>

							<button
								onClick={() => {
									setRefreshing(true)
									fetchDepartmentsWithUsers()
								}}
								disabled={refreshing}
								className="flex items-center justify-center p-2.5 rounded-full bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
								title="Yangilash"
							>
								{refreshing ? (
									<PulseLoader size={6} color="#6B7280" />
								) : (
									<FiRefreshCw className="h-5 w-5" />
								)}
							</button>
						</div>
					</div>

					{/* Date range picker and download button */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
						<div className="flex items-center space-x-2">
							<div className="relative">
								<input
									type="date"
									className="block w-full pl-10 text-black pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
								/>
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FaRegCalendarAlt className="h-4 w-4 text-gray-400" />
								</div>
							</div>
							<span className="text-gray-500">dan</span>
							<div className="relative">
								<input
									type="date"
									className="block w-full pl-10 text-black pr-3 py-2 text-sm border-gray-300 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									min={startDate}
								/>
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FaRegCalendarAlt className="h-4 w-4 text-gray-400" />
								</div>
							</div>
							<span className="text-gray-500">gacha</span>
						</div>

						<button
							onClick={handleDownload}
							disabled={downloadLoading || !startDate || !endDate}
							className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${downloadLoading || !startDate || !endDate
								? 'bg-gray-200 text-gray-500 cursor-not-allowed'
								: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-md'
								}`}
						>
							{downloadLoading ? (
								<PulseLoader size={8} color="#ffffff" />
							) : (
								<>
									<FaFileExcel className="mr-2" />
									Excel yuklab olish
								</>
							)}
						</button>
					</div>

					{/* Filter tabs */}
					<div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
						{[
							{ value: 'all', label: 'Hammasi', icon: <FaUsers className="mr-1.5" />, color: 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800' },
							{ value: 'ishda', label: 'Ishda', icon: <FaUserCheck className="mr-1.5" />, color: 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800' },
							{ value: 'kelmagan', label: 'Kelmagan', icon: <FaUserTimes className="mr-1.5" />, color: 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800' },
							{ value: 'tashqarida', label: 'Tashqarida', icon: <FaUserSlash className="mr-1.5" />, color: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800' },
						].map((tab) => (
							<button
								key={tab.value}
								onClick={() => setActiveTab(tab.value)}
								className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-all shadow-sm ${activeTab === tab.value
									? `${tab.color} shadow-md`
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
							>
								{tab.icon}
								{tab.label}
							</button>
						))}
					</div>
				</div>
			</header>

			{/* Main content */}
			<main className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
				{loading ? (
					<div className="flex justify-center items-center h-64">
						<PulseLoader color="#6366F1" size={15} />
					</div>
				) : filteredDepartments.length === 0 ? (
					<div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
						<div className="mx-auto h-24 w-24 text-gray-400">
							<FaUserSlash className="w-full h-full" />
						</div>
						<h3 className="mt-3 text-xl font-medium text-gray-900">Xodimlar topilmadi</h3>
						<p className="mt-2 text-sm text-gray-500">
							{searchTerm ? "Qidiruv bo'yicha xodim topilmadi" : "Tizimda xodimlar mavjud emas"}
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{filteredDepartments.map(dept => (
							<section
								key={dept._id}
								className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
							>
								<div className="px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-gray-50">
									<div className="flex items-center space-x-4">
										<span className={`px-4 py-1.5 rounded-full text-sm font-medium ${dept.badgeStyle} shadow-sm`}>
											{dept.name}
										</span>
										<span className="text-sm text-gray-600 font-medium">
											{dept.users.length} ta xodim
										</span>
									</div>
									<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
										ID: {dept._id.slice(-4)}
									</span>
								</div>

								<div className="divide-y divide-gray-200">
									{dept.users.map(user => (
										<div
											key={user._id}
											className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group"
											onClick={() => setSelectedUserId(user._id)}
										>
											<div className="flex items-center space-x-4">
												<UserAvatar user={user} />
												<div>
													<h3 className="text-base font-medium text-gray-900 group-hover:text-indigo-600">
														{user.fullName}
													</h3>
													<div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
														<p className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
															{user.position || "Lavozim ko'rsatilmagan"}
														</p>
														{user.username && (
															<p className="text-xs text-gray-500">@{user.username}</p>
														)}
													</div>
												</div>
											</div>
											<div className="flex items-center space-x-4">
												<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.attendanceStatus)} shadow-sm`}>
													{getStatusIcon(user.attendanceStatus)}
													<span className="ml-2">{getStatusText(user.attendanceStatus)}</span>
												</span>
												<FiChevronRight className="text-gray-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" />
											</div>
										</div>
									))}
								</div>
							</section>
						))}
					</div>
				)}
			</main>

			{/* Stats footer */}
			<footer className="bg-white border-t border-gray-200 py-4 px-6 shadow-lg">
				<div className="flex flex-wrap items-center justify-between text-sm">
					<div className="flex items-center space-x-6">
						<span className="flex items-center text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
							<FaUserCheck className="text-emerald-500 mr-2" />
							Ishda: {departments.reduce((acc, dept) =>
								acc + dept.users.filter(u => u.attendanceStatus === 'ishda').length, 0
							)}
						</span>
						<span className="flex items-center text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full">
							<FaUserTimes className="text-rose-500 mr-2" />
							Kelmagan: {departments.reduce(
								(acc, dept) =>
									acc +
									dept.users.filter(
										(u) =>
											u.attendanceStatus === 'kelmagan' ||
											!['ishda', 'tashqarida'].includes(u.attendanceStatus)
									).length,
								0
							)}
						</span>

						<span className="flex items-center text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
							<FaUserSlash className="text-blue-500 mr-2" />
							Tashqarida: {departments.reduce((acc, dept) =>
								acc + dept.users.filter(u => u.attendanceStatus === 'tashqarida').length, 0
							)}
						</span>
					</div>
					<div className="flex items-center text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
						<FaRegCalendarAlt className="text-indigo-500 mr-2" />
						{new Date().toLocaleDateString('uz-UZ', {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</div>
				</div>
			</footer>

			{/* User Attendance Modal */}
			{selectedUserId && (
				<UserAttendanceModal
					userId={selectedUserId}
					onClose={() => setSelectedUserId(null)}
				/>
			)}
		</div>
	)
}

export default AdminAttendance
