import axios from 'axios'
import { useEffect, useState } from 'react'
import { FiBriefcase, FiSearch, FiUser } from 'react-icons/fi'
import { ToastContainer, toast } from 'react-toastify'

const AdminPost = () => {
	const token = localStorage.getItem('token')
	const [users, setUsers] = useState([])
	const [filteredUsers, setFilteredUsers] = useState([])
	const [searchTerm, setSearchTerm] = useState('')

	const fetchUsers = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAllpost`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				setUsers(res.data.users)
				setFilteredUsers(res.data.users)
			}
		} catch (error) {
			toast.error('Foydalanuvchilarni yuklashda xatolik yuz berdi')
		}
	}

	useEffect(() => {
		fetchUsers()
	}, [])

	useEffect(() => {
		filterUsers()
	}, [searchTerm, users])

	const filterUsers = () => {
		let result = [...users]
		if (searchTerm) {
			const term = searchTerm.toLowerCase()
			result = result.filter(user =>
				user.fullName.toLowerCase().includes(term) ||
				user.position.toLowerCase().includes(term) ||
				user.username.toLowerCase().includes(term))
		}
		setFilteredUsers(result)
	}

	const getStatusClass = (status) => {
		switch (status) {
			case 'kelmagan': return 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200'
			case 'tashqarida': return 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border border-amber-200'
			case 'ishda': return 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200'
			default: return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200'
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

	return (
		<div className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
			<ToastContainer
				position="top-right"
				autoClose={5000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme="light"
			/>

			{/* Header Section */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-indigo-700 flex items-center">
						<FiBriefcase className="mr-3 text-purple-600" />
						Post Xodimlari
					</h1>
					<p className="text-gray-600 mt-1">Barcha post xodimlarining ma'lumotlari</p>
				</div>
			</div>

			{/* Search and Stats Card */}
			<div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-100">
				<div className="flex flex-col md:flex-row md:items-center gap-4">
					<div className="relative flex-1">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<FiSearch className="text-gray-400" />
						</div>
						<input
							type="text"
							placeholder="Xodimlarni qidirish..."
							className="w-full pl-10 pr-4 py-3 border text-black border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 rounded-xl border border-blue-100">
						<p className="text-sm text-gray-600">Xodimlar</p>
						<p className="text-xl font-bold text-purple-700">{users.length}</p>
					</div>
				</div>
			</div>

			{/* Main Table */}
			<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gradient-to-r from-purple-50 to-blue-50">
							<tr>
								<th className="px-6 py-4 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">Rasm</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">Ism Familiya</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">Lavozim</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">Foydalanuvchi</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">Holati</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredUsers.length > 0 ? (
								filteredUsers.map(user => (
									<tr key={user._id} className="hover:bg-gray-50 transition-colors">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex-shrink-0 h-10 w-10">
												{user.photo ? (
													<img
														className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
														src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
														alt={user.fullName}
													/>
												) : (
													<div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center text-purple-600 font-medium">
														{user.fullName.charAt(0)}
													</div>
												)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-semibold text-gray-800">{user.fullName}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-600">{user.position}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-blue-600">{user.username}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(user.attendanceStatus)}`}>
												{getStatusText(user.attendanceStatus)}
											</span>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="5" className="px-6 py-8 text-center">
										<div className="flex flex-col items-center justify-center">
											<FiUser className="h-12 w-12 text-gray-400 mb-3" />
											<h3 className="text-lg font-medium text-gray-700">Hech qanday xodim topilmadi</h3>
											<p className="text-gray-500 mt-1">
												{searchTerm ? "Boshqa kalit so'zlar bilan qayta urinib ko'ring" : "Ma'lumotlar mavjud emas"}
											</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

export default AdminPost