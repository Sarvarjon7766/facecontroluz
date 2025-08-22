import axios from 'axios'
import { useEffect, useState } from 'react'
import { FiChevronDown, FiChevronUp, FiFilter, FiSearch, FiUsers } from 'react-icons/fi'
import { ToastContainer } from 'react-toastify'

const UserUsers = () => {
	const token = localStorage.getItem('token')
	const [departments, setDepartments] = useState([])
	const [selectedDepartment, setSelectedDepartment] = useState(null)
	const [users, setUsers] = useState([])
	const [filteredUsers, setFilteredUsers] = useState([])
	const [searchTerm, setSearchTerm] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [expandedDepartments, setExpandedDepartments] = useState({})

	const fetchDepartments = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/departament/getAll`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (res.data.success) {
				setDepartments(res.data.departments)
				const expandedState = {}
				res.data.departments.forEach(dept => {
					expandedState[dept._id] = true
				})
				setExpandedDepartments(expandedState)
			}
		} catch (error) {
			toast.error("Server bilan aloqa xatosi")
		}
	}

	const fetchUsers = async () => {
		setIsLoading(true)
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (res.data.success) {
				setUsers(res.data.users)
				setFilteredUsers(res.data.users)
			}
		} catch (error) {
			toast.error("Server bilan aloqa xatosi")
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchDepartments()
		fetchUsers()
	}, [])

	useEffect(() => {
		filterUsers()
	}, [selectedDepartment, searchTerm, users])

	const filterUsers = () => {
		let result = [...users]
		if (selectedDepartment && selectedDepartment !== 'all') {
			result = result.filter(user =>
				user.department && user.department._id === selectedDepartment
			)
		}
		if (searchTerm) {
			const term = searchTerm.toLowerCase()
			result = result.filter(user =>
				user.fullName.toLowerCase().includes(term) ||
				user.position.toLowerCase().includes(term))
		}
		setFilteredUsers(result)
	}

	const toggleDepartment = (deptId) => {
		setExpandedDepartments(prev => ({
			...prev,
			[deptId]: !prev[deptId]
		}))
	}

	const getUsersByDepartment = (deptId) => {
		return filteredUsers.filter(user =>
			user.department && user.department._id === deptId
		)
	}

	return (
		<div className="p-4 md:p-6 bg-gray-50 min-h-screen">
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
			{/* Filter Section */}
			<div className="bg-white rounded-lg shadow-sm p-4 md:p-5 mb-6 border border-gray-200">
				<div className="flex flex-col md:flex-row md:items-center gap-3">
					{/* Search Input */}
					<div className="relative flex-1">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<FiSearch className="text-gray-400" />
						</div>
						<input
							type="text"
							placeholder="Ism, familiya yoki lavozim boʻyicha qidirish..."
							className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-gray-700 transition-all duration-200"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Department Filter */}
					<div className="flex items-center gap-2 w-full md:w-auto">
						<div className="relative w-full md:w-56">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<FiFilter className="text-gray-400" />
							</div>
							<select
								className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700 transition-all duration-200"
								value={selectedDepartment}
								onChange={(e) => setSelectedDepartment(e.target.value)}
							>
								<option value={null} className="text-gray-500">Barcha boʻlimlar</option>
								{departments.map(dept => (
									<option key={dept._id} value={dept._id} className="text-gray-700">{dept.name}</option>
								))}
							</select>
						</div>
					</div>
				</div>
			</div>

			{/* Loading State */}
			{isLoading ? (
				<div className="flex justify-center items-center p-12">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
					<span className="ml-3 text-gray-600 font-medium">Ma'lumotlar yuklanmoqda...</span>
				</div>
			) : selectedDepartment ? (
				// Show selected department with its users
				<div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
					<div className="p-4 md:p-5 border-b border-gray-200 bg-gray-50">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
							<div>
								<h2 className="text-lg md:text-xl font-semibold text-gray-800">
									{departments.find(d => d._id === selectedDepartment)?.name || 'Tanlangan boʻlim'}
								</h2>
								<p className="text-gray-600 mt-1 text-sm">
									{getUsersByDepartment(selectedDepartment).length} ta xodim
								</p>
							</div>
							<button
								onClick={() => setSelectedDepartment(null)}
								className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
							>
								Barcha boʻlimlarni koʻrish
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">№</th>
									<th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rasm</th>
									<th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xodim</th>
									<th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lavozim</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{getUsersByDepartment(selectedDepartment).length > 0 ? (
									getUsersByDepartment(selectedDepartment).map((user, index) => (
										<tr key={user._id} className="hover:bg-gray-50 transition-colors">
											<td className="px-5 py-4 text-sm text-gray-500 font-medium">
												{index + 1}
											</td>
											<td className="px-5 py-4">
												<div className="flex-shrink-0 h-14 w-14">
													{user.photo ? (
														<img
															className="h-14 w-14 rounded-full object-cover border border-gray-200"
															src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
															alt={user.fullName}
														/>
													) : (
														<div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-medium border border-gray-200 text-lg">
															{user.fullName.split(' ').map(n => n[0]).join('')}
														</div>
													)}
												</div>
											</td>
											<td className="px-5 py-4">
												<div className="text-sm font-medium text-gray-900">{user.fullName}</div>
												<div className="text-xs text-gray-500">{user.department?.name || 'Boʻlim mavjud emas'}</div>
											</td>
											<td className="px-5 py-4">
												<div className="text-sm text-gray-900 font-medium">
													{user.position}
												</div>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan="4" className="px-6 py-12 text-center">
											<div className="flex flex-col items-center justify-center">
												<FiUsers className="h-16 w-16 text-gray-300 mb-4" />
												<h3 className="text-lg font-medium text-gray-700">Xodimlar topilmadi</h3>
												<p className="text-gray-500 mt-2 max-w-md text-sm">
													Ushbu boʻlimda hozircha xodimlar mavjud emas yoki qidiruv boʻyicha hech narsa topilmadi
												</p>
											</div>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			) : (
				// Show all departments with expandable user lists
				<div className="space-y-4">
					{departments.map(department => (
						<div key={department._id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
							<div
								className="p-4 md:p-5 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
								onClick={() => toggleDepartment(department._id)}
							>
								<div>
									<h2 className="text-lg md:text-xl font-semibold text-gray-800">
										{department.name}
									</h2>
									<p className="text-gray-600 mt-1 text-sm">
										{getUsersByDepartment(department._id).length} ta xodim
									</p>
								</div>
								<div className="text-gray-400 hover:text-gray-600 transition-colors">
									{expandedDepartments[department._id] ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
								</div>
							</div>

							{expandedDepartments[department._id] && (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">№</th>
												<th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rasm</th>
												<th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xodim</th>
												<th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lavozim</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{getUsersByDepartment(department._id).length > 0 ? (
												getUsersByDepartment(department._id).map((user, index) => (
													<tr key={user._id} className="hover:bg-gray-50 transition-colors">
														<td className="px-5 py-4 text-sm text-gray-500 font-medium">
															{index + 1}
														</td>
														<td className="px-5 py-4">
															<div className="flex-shrink-0 h-16 w-16">
																{user.photo ? (
																	<img
																		className="h-14 w-14 rounded-full object-cover border border-gray-200"
																		src={`${import.meta.env.VITE_BASE_URL}/uploads/${user.photo}`}
																		alt={user.fullName}
																	/>
																) : (
																	<div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-medium border border-gray-200 text-lg">
																		{user.fullName.split(' ').map(n => n[0]).join('')}
																	</div>
																)}
															</div>
														</td>
														<td className="px-5 py-4">
															<div className="text-sm font-medium text-gray-900">{user.fullName}</div>
															<div className="text-xs text-gray-500">{user.department?.name || 'Boʻlim mavjud emas'}</div>
														</td>
														<td className="px-5 py-4">
															<div className="text-sm text-gray-900 font-medium">
																{user.position}
															</div>
														</td>
													</tr>
												))
											) : (
												<tr>
													<td colSpan="4" className="px-6 py-8 text-center">
														<div className="flex flex-col items-center justify-center">
															<FiUsers className="h-12 w-12 text-gray-300 mb-3" />
															<h3 className="text-base font-medium text-gray-700">Xodimlar topilmadi</h3>
															<p className="text-gray-500 mt-1 text-sm">Ushbu boʻlimda hozircha xodimlar mavjud emas</p>
														</div>
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export default UserUsers
