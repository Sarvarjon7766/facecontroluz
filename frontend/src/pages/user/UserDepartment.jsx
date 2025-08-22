import axios from 'axios'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FiSearch, FiUser, FiUsers } from 'react-icons/fi'
import { toast } from 'react-toastify'

const UserDepartment = () => {
	const token = localStorage.getItem('token')
	const [departments, setDepartments] = useState([])
	const [users, setUsers] = useState([])
	const [isLoading, setIsLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')

	// Fetch all departments
	const fetchDepartments = async () => {
		setIsLoading(true)
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				setDepartments(res.data.departments)
			} else {
				toast.error(res.data.message)
			}
		} catch (error) {
			toast.error("Server bilan aloqa xatosi")
		} finally {
			setIsLoading(false)
		}
	}

	const fetchUsers = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				setUsers(res.data.users)
			}
		} catch (error) {
			toast.error("Server bilan aloqa xatosi")
		}
	}

	useEffect(() => {
		fetchDepartments()
		fetchUsers()
	}, [])

	// Filter departments
	const filteredDepartments = departments.filter(dept =>
		dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
		(dept.head && dept.head.fullName.toLowerCase().includes(searchTerm.toLowerCase())))

	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-6">
			{/* Header Section */}
			<div className="mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
					<div>
						<h1 className="text-2xl font-bold text-gray-800 flex items-center">
							<FiUsers className="mr-2 text-blue-600" />
							<span>Bo'limlar Ro'yxati</span>
						</h1>
						<p className="text-gray-500 mt-1 text-sm">
							Tizimdagi barcha bo'limlar jadvali
						</p>
					</div>

					<div className="flex gap-3 w-full md:w-auto">
						<div className="relative flex-1 md:w-64">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<FiSearch className="text-gray-400" />
							</div>
							<input
								type="text"
								placeholder="Bo'lim qidirish..."
								className="block w-full pl-10 pr-4 text-black py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>
				</div>

				{/* Main Content */}
				{isLoading ? (
					<div className="flex justify-center py-20">
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
							className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-r-blue-300 border-b-blue-100 border-l-transparent"
						/>
					</div>
				) : filteredDepartments.length === 0 ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
					>
						<div className="mx-auto h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
							<FiUsers className="text-blue-500 text-2xl" />
						</div>
						<h3 className="text-lg font-medium text-gray-800 mb-2">
							{searchTerm ? "Natija topilmadi" : "Bo'limlar mavjud emas"}
						</h3>
						<p className="text-gray-500 max-w-md mx-auto">
							{searchTerm
								? `"${searchTerm}" bo'yicha hech qanday bo'lim topilmadi`
								: "Hozircha tizimda birorta ham bo'lim mavjud emas"}
						</p>
					</motion.div>
				) : (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
					>
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Bo'lim nomi
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Tavsifi
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Xodimlar soni
										</th>
										<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Boshlig'i
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{filteredDepartments.map((dept) => (
										<motion.tr
											key={dept._id}
											whileHover={{ backgroundColor: "#f8fafc" }}
											className="transition-colors"
										>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center">
													<div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
														{dept.name.charAt(0)}
													</div>
													<div className="text-sm font-medium text-gray-900">{dept.name}</div>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="text-sm text-gray-500 max-w-xs">
													{dept.description || 'Tavsif mavjud emas'}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
													{users.filter(u => u.department?._id === dept._id).length} ta
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{dept.head ? (
													<div className="flex items-center">
														<div className="flex-shrink-0 h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center mr-2">
															{dept.head.photo ? (
																<img
																	src={`${import.meta.env.VITE_BASE_URL}/uploads/${dept.head.photo}`}
																	alt={dept.head.fullName}
																	className="h-full w-full rounded-full object-cover"
																/>
															) : (
																<FiUser className="text-purple-500" />
															)}
														</div>
														<div>
															<div className="text-sm font-medium text-gray-900">{dept.head.fullName}</div>
															<div className="text-xs text-gray-500">Bo'lim boshlig'i</div>
														</div>
													</div>
												) : (
													<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
														Tayinlanmagan
													</span>
												)}
											</td>
										</motion.tr>
									))}
								</tbody>
							</table>
						</div>
					</motion.div>
				)}
			</div>
		</div>
	)
}

export default UserDepartment