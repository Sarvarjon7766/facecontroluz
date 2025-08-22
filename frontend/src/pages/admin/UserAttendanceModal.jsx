import axios from 'axios'
import { useEffect, useState } from 'react'
import { FiBarChart2, FiCalendar, FiClock, FiDownload, FiUser, FiX } from 'react-icons/fi'
import { PulseLoader } from 'react-spinners'
import { toast } from 'react-toastify'
import * as XLSX from "xlsx-js-style"

const UserAttendanceModal = ({ userId, onClose }) => {
	const token = localStorage.getItem('token')
	const [loading, setLoading] = useState(true)
	const [user, setUser] = useState(null)
	const [attendanceHistory, setAttendanceHistory] = useState([])
	const [stats, setStats] = useState({
		totalDays: 0,
		presentDays: 0,
		absentDays: 0,
		averageHours: 0,
		lastMonthPresent: 0
	})

	// Fetch user details and attendance history
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true)
				const [userRes, historyRes] = await Promise.all([
					axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getById/${userId}`, {
						headers: { Authorization: `Bearer ${token}` },
					}),
					axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/attandance/${userId}`, {
						headers: { Authorization: `Bearer ${token}` },
					}),
				])

				if (userRes.data.success) {
					setUser(userRes.data.user)
				}

				if (historyRes.data.success) {
					const history = historyRes.data.attendanceHistory
					setAttendanceHistory(history)
					calculateStats(history)
				}
			} catch (error) {
				toast.error("Ma'lumotlarni yuklashda xato yuz berdi")
				console.error('Error fetching data:', error)
			} finally {
				setLoading(false)
			}
		}

		if (userId) {
			fetchData()
		}
	}, [userId, token])

	// Calculate statistics
	const calculateStats = (history) => {
		const presentDays = history.filter(record =>
			record.status === 'ishda' || record.logs.some(log => log.checkin)
		).length

		const absentDays = history.filter(record =>
			record.status === 'kelmagan' || record.logs.length === 0
		).length

		const totalHours = history.reduce((sum, record) => {
			return sum + (record.hoursWorked || 0)
		}, 0)

		setStats({
			totalDays: history.length,
			presentDays,
			absentDays,
			averageHours: history.length > 0 ? (totalHours / presentDays).toFixed(1) : 0,
			lastMonthPresent: calculateLastMonthPresent(history)
		})
	}

	const calculateLastMonthPresent = (history) => {
		const oneMonthAgo = new Date()
		oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

		return history.filter(record => {
			const recordDate = new Date(record.date)
			return recordDate >= oneMonthAgo &&
				(record.status === 'ishda' || record.logs.some(log => log.checkin))
		}).length
	}

	// Format time
	const formatTime = (timeString) => {
		if (!timeString) return '--:--'
		const date = new Date(timeString)
		return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
	}

	const uzbekWeekdays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']
	const uzbekMonths = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

	const formatDate = (dateString) => {
		const date = new Date(dateString)
		const day = date.getDate()
		const month = uzbekMonths[date.getMonth()]
		const weekday = uzbekWeekdays[date.getDay()]
		return `${day} ${month}, ${weekday}`
	}



	const exportToExcel = () => {
		const data = attendanceHistory.flatMap(record => {
			if (record.logs.length > 0) {
				return record.logs.map(log => ({
					Sana: formatDate(log.date || record.date),
					Kun: getUzbekWeekday(new Date(log.date || record.date)),
					Holati: log.checkout === false ? 'Ishda' : log.checkout === true ? 'Tashqarida' : 'Noma\'lum',
					'Kelish vaqti': formatTime(log.checkInTime),
					'Ketish vaqti': formatTime(log.checkOutTime) || '--:--',
					'Ish vaqti': calculateWorkDuration(log.checkInTime, log.checkOutTime),
					Izoh: log.comment || ''
				}))
			}
			return {
				Sana: formatDate(record.date),
				Kun: getUzbekWeekday(new Date(record.date)),
				Holati: record.status === "ishda" ? 'Ishda' : record.status === 'tashqarida' ? 'Tashqarida' : 'Kelmadi',
				'Kelish vaqti': '--:--',
				'Ketish vaqti': '--:--',
				'Ish vaqti': '00:00',
				Izoh: 'Log mavjud emas'
			}
		})

		// Agar ma'lumot bo'lmasa
		if (data.length === 0) {
			toast.info("Eksport qilish uchun ma'lumot mavjud emas")
			return
		}

		// Sarlavha qatorini yaratish
		const headerRow = Object.keys(data[0])

		// Ma'lumotlarni qatorlarga aylantirish
		const rows = data.map(item => headerRow.map(key => item[key]))

		// Workbook va worksheet yaratish
		const workbook = XLSX.utils.book_new()
		const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...rows])

		// Stillar sozlamalari
		const headerStyle = {
			font: { bold: true, color: { rgb: "FFFFFF" } },
			fill: { fgColor: { rgb: "4F46E5" } }, // Indigo-600
			alignment: { horizontal: "center", vertical: "center" },
			border: {
				top: { style: "thin", color: { rgb: "000000" } },
				bottom: { style: "thin", color: { rgb: "000000" } },
				left: { style: "thin", color: { rgb: "000000" } },
				right: { style: "thin", color: { rgb: "000000" } }
			}
		}

		const dateStyle = {
			font: { bold: true },
			alignment: { horizontal: "left" }
		}

		const timeStyle = {
			alignment: { horizontal: "center" },
			numFmt: "hh:mm"
		}

		const statusStyle = (value) => {
			let color
			if (value === 'Ishda') color = "FF10B981" // Emerald-500
			else if (value === 'Tashqarida') color = "FF3B82F6" // Blue-500
			else if (value === 'Kelmadi') color = "FFEF4444" // Red-500
			else color = "FF6B7280" // Gray-500

			return {
				fill: { fgColor: { rgb: color } },
				font: { bold: true, color: { rgb: "FFFFFF" } },
				alignment: { horizontal: "center" }
			}
		}

		// Sarlavha qatoriga stil berish
		for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
			const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex })
			if (worksheet[cellRef]) {
				worksheet[cellRef].s = headerStyle
			}
		}

		// Ma'lumot qatorlariga stil berish
		for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
			for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
				const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex })

				// Hujayra mavjudligini tekshirish
				if (!worksheet[cellRef]) {
					// Agar hujayra mavjud bo'lmasa, yangi hujayra yaratish
					worksheet[cellRef] = { t: 's', v: rows[rowIndex][colIndex] }
				}

				// Sana ustuni uchun stil
				if (colIndex === 0) {
					worksheet[cellRef].s = dateStyle
				}
				// Kun ustuni uchun stil
				else if (colIndex === 1) {
					worksheet[cellRef].s = { alignment: { horizontal: "center" } }
				}
				// Holati ustuni uchun stil
				else if (colIndex === 2) {
					worksheet[cellRef].s = statusStyle(rows[rowIndex][colIndex])
				}
				// Vaqt ustunlari uchun stil
				else if ([3, 4, 5].includes(colIndex)) {
					worksheet[cellRef].s = timeStyle
				}
				// Izoh uchun stil
				else if (colIndex === 6) {
					worksheet[cellRef].s = { alignment: { horizontal: "left", wrapText: true } }
				}
			}
		}

		// Ustun enlarini sozlash
		worksheet['!cols'] = [
			{ width: 15 }, // Sana
			{ width: 12 }, // Kun
			{ width: 12 }, // Holati
			{ width: 12 }, // Kelish vaqti
			{ width: 12 }, // Ketish vaqti
			{ width: 12 }, // Ish vaqti
			{ width: 30 }  // Izoh
		]

		// Worksheetni workbookga qo'shish
		XLSX.utils.book_append_sheet(workbook, worksheet, "Davomat tarixi")

		// Excel faylini yuklab olish
		XLSX.writeFile(workbook, `${user?.fullName || 'Xodim'}_davomat.xlsx`)

		toast.success("Excel fayli muvaffaqiyatli yuklab olindi")
	}

	// Qo'shimcha yordamchi funksiyalar
	const getUzbekWeekday = (date) => {
		const weekdays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
		return weekdays[date.getDay()]
	}

	const calculateWorkDuration = (checkInTime, checkOutTime) => {
		if (!checkInTime || !checkOutTime) return '00:00'

		const checkIn = new Date(checkInTime)
		const checkOut = new Date(checkOutTime)

		// Agar chiqish vaqti kirish vaqtidan oldin bo'lsa
		if (checkOut < checkIn) return '00:00'

		const durationMs = checkOut - checkIn
		const hours = Math.floor(durationMs / (1000 * 60 * 60))
		const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
	}

	if (!userId) return null

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
				{/* Background overlay - Tahrirlangan qism */}
				<div className="fixed inset-0 transition-opacity" aria-hidden="true">
					<div className="absolute inset-0 bg-gray-900 opacity-50" onClick={onClose}></div>
				</div>

				{/* Modal container - Tahrirlangan qism */}
				<div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-10">
					{loading && !user ? (
						<div className="flex justify-center items-center p-12">
							<PulseLoader color="#6366F1" size={15} />
						</div>
					) : (
						<>
							{/* Header */}
							<div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
								<div className="flex items-center justify-between">
									<h3 className="text-xl font-bold text-white flex items-center">
										<FiUser className="mr-3 text-indigo-200" />
										{user?.fullName} - Davomat tarixi
									</h3>
									<button
										onClick={onClose}
										className="text-indigo-200 hover:text-white transition-colors p-1 rounded-full hover:bg-indigo-700"
									>
										<FiX className="h-6 w-6" />
									</button>
								</div>
							</div>

							{/* User info */}
							<div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50">
								<div className="flex items-start space-x-5">
									{/* Avatar */}
									<div className="flex-shrink-0 h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
										{user?.photo ? (
											<img
												src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
												alt={user.fullName}
												className="h-full w-full rounded-full object-cover"
											/>
										) : (
											user?.fullName?.charAt(0)?.toUpperCase()
										)}
									</div>

									{/* User details */}
									<div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
										<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
											<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Lavozim</h4>
											<p className="mt-1 text-lg font-semibold text-gray-900">{user?.position || "—"}</p>
										</div>
										<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
											<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Holati</h4>
											<p className="mt-1">
												<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${user?.attendanceStatus === "ishda" ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
													user?.attendanceStatus === 'tashqarida' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
														'bg-rose-100 text-rose-800 border border-rose-200'
													}`}>
													{user?.attendanceStatus === 'ishda' ? 'Ishda' :
														user?.attendanceStatus === 'tashqarida' ? 'Tashqarida' : 'Kelmadi'}
												</span>
											</p>
										</div>
										<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
											<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bo'lim</h4>
											<p className="mt-1 text-lg font-semibold text-gray-900">{user?.department?.name || "—"}</p>
										</div>
									</div>
								</div>
							</div>

							{/* Statistics */}
							<div className="px-6 py-5 bg-white border-b border-gray-200">
								<div className="flex items-center justify-between mb-4">
									<h4 className="text-base font-semibold text-gray-900 flex items-center">
										<FiBarChart2 className="mr-2 text-indigo-600" />
										Statistik ko'rsatkichlar
									</h4>
									<button
										onClick={exportToExcel}
										className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
									>
										<FiDownload className="mr-2" />
										Excelga yuklash
									</button>
								</div>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm">
										<div className="text-sm font-medium text-blue-800">Umumiy kunlar</div>
										<div className="text-3xl font-bold text-blue-900 mt-1">{stats.totalDays}</div>
										<div className="text-xs text-blue-600 mt-2">Jami ish kunlari</div>
									</div>
									<div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
										<div className="text-sm font-medium text-emerald-800">Ishga kelgan</div>
										<div className="text-3xl font-bold text-emerald-900 mt-1">{stats.presentDays}</div>
										<div className="text-xs text-emerald-600 mt-2">
											{stats.totalDays > 0 ? `${Math.round((stats.presentDays / stats.totalDays) * 100)}%` : '0%'} ishga kelgan
										</div>
									</div>
									<div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100 shadow-sm">
										<div className="text-sm font-medium text-amber-800">O'rtacha ish vaqti</div>
										<div className="text-3xl font-bold text-amber-900 mt-1">{stats.averageHours}</div>
										<div className="text-xs text-amber-600 mt-2">soat / kun</div>
									</div>
									<div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100 shadow-sm">
										<div className="text-sm font-medium text-purple-800">Oxirgi oyda</div>
										<div className="text-3xl font-bold text-purple-900 mt-1">{stats.lastMonthPresent}</div>
										<div className="text-xs text-purple-600 mt-2">kun ishga kelgan</div>
									</div>
								</div>
							</div>

							{/* Attendance history */}
							<div className="px-6 py-5">
								<h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
									<FiCalendar className="mr-2 text-indigo-600" />
									Davomat tarixi
								</h4>

								{attendanceHistory.length === 0 ? (
									<div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
										<div className="mx-auto h-16 w-16 text-gray-400 mb-3">
											<FiCalendar className="w-full h-full" />
										</div>
										<h3 className="text-lg font-medium text-gray-700">Davomat tarixi mavjud emas</h3>
										<p className="text-sm text-gray-500 mt-1">Xodimning davomat yozuvlari topilmadi</p>
									</div>
								) : (
									<div className="overflow-hidden border border-gray-200 rounded-xl">
										<table className="min-w-full divide-y divide-gray-200">
											<thead className="bg-gray-50">
												<tr>
													<th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sana</th>
													<th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Holati</th>
													<th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
														<div className="flex items-center">
															<FiClock className="mr-2" /> Kelish
														</div>
													</th>
													<th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
														<div className="flex items-center">
															<FiClock className="mr-2" /> Ketish
														</div>
													</th>
													<th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Izoh</th>
												</tr>
											</thead>
											<tbody className="bg-white divide-y divide-gray-200">
												{attendanceHistory.map((record, index) =>
													record.logs.length > 0 ? (
														record.logs.map((log, idx) => (
															<tr key={`${index}-${idx}`} className="hover:bg-gray-50 transition-colors">
																<td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
																	{formatDate(log.date || record.date)}
																</td>
																<td className="px-5 py-4 whitespace-nowrap text-sm">
																	{log.checkin === true && log.checkout === false ? (
																		<span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
																			Ishda
																		</span>
																	) : log.checkin === true && log.checkout === true ? (
																		<span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
																			Tashqarida
																		</span>
																	) : (
																		<span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
																			Noma'lum
																		</span>
																	)}
																</td>
																<td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
																	<span className="font-medium">{formatTime(log.checkInTime)}</span>
																</td>
																<td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
																	<span className="font-medium">{formatTime(log.checkOutTime) || '--:--'}</span>
																</td>
																<td className="px-5 py-4 text-sm text-gray-500 max-w-xs">
																	<div className="truncate">{log.comment || '—'}</div>
																</td>
															</tr>
														))
													) : (
														<tr key={index} className="hover:bg-gray-50 transition-colors">
															<td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
																{formatDate(record.date)}
															</td>
															<td className="px-5 py-4 whitespace-nowrap text-sm">
																<span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'ishda' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
																	record.status === 'tashqarida' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
																		'bg-rose-100 text-rose-800 border border-rose-200'
																	}`}>
																	{record.status === 'ishda' ? 'Ishda' :
																		record.status === 'tashqarida' ? 'Tashqarida' : 'Kelmadi'}
																</span>
															</td>
															<td colSpan={3} className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
																Kirish chiqish mavjud emas
															</td>
														</tr>
													)
												)}
											</tbody>
										</table>
									</div>
								)}
							</div>

							{/* Footer */}
							<div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
								<div className="text-sm text-gray-500 flex items-center">
									<FiClock className="mr-2 text-indigo-500" />
									Oxirgi yangilanish: {new Date().toLocaleDateString('uz-UZ')}
								</div>
								<button
									onClick={onClose}
									className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 border border-transparent rounded-xl text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none shadow-sm transition-all"
								>
									Yopish
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	)
}

export default UserAttendanceModal