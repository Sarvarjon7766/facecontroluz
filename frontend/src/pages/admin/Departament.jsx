import axios from 'axios'
import { useEffect, useState } from 'react'
import { FiCheck, FiDownload, FiEdit, FiFileText, FiHome, FiPlus, FiSearch, FiUser, FiUsers, FiX } from 'react-icons/fi'
import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'

const Department = () => {
	const token = localStorage.getItem('token')
	const [departments, setDepartments] = useState([])
	const [users, setUsers] = useState([])
	const [head, setHead] = useState(null)
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [exportLoading, setExportLoading] = useState(false)
	const [activeTab, setActiveTab] = useState('list')
	const [searchTerm, setSearchTerm] = useState('')
	const [editingId, setEditingId] = useState(null)

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
			toast.error("Server xatosi")
		} finally {
			setIsLoading(false)
		}
	}

	// Fetch all users
	const fetchUsers = async () => {
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.data.success) {
				setUsers(res.data.users)
			}
		} catch (error) {
			toast.error("Server xatosi")
		}
	}

	// Create or update department
	const handleSubmit = async (e) => {
		e.preventDefault()
		setIsLoading(true)
		try {
			const url = editingId
				? `${import.meta.env.VITE_BASE_URL}/api/departament/update/${editingId}`
				: `${import.meta.env.VITE_BASE_URL}/api/departament/createdepartament`

			const method = editingId ? 'put' : 'post'

			const res = await axios[method](
				url,
				{ name, description, head: head ? head._id : null },
				{ headers: { Authorization: `Bearer ${token}` } }
			)

			if (res.data.success) {
				toast.success(editingId ? "Bo'lim yangilandi!" : "Bo'lim qo'shildi!")
				resetForm()
				fetchDepartments()
				setActiveTab('list')
			}
		} catch (error) {
			toast.error("Xatolik yuz berdi")
		} finally {
			setIsLoading(false)
		}
	}

	// Edit department
	const handleEdit = (dept) => {
		setEditingId(dept._id)
		setName(dept.name)
		setDescription(dept.description)
		setHead(dept.head || null)
		setActiveTab('create')
	}

	const resetForm = () => {
		setEditingId(null)
		setName('')
		setDescription('')
		setHead(null)
	}

	// Export to Excel
	const exportToExcel = async () => {
		setExportLoading(true)
		try {
			const exportData = departments.map((dept, index) => ({
				'№': index + 1,
				'Nomi': dept.name,
				'Tavsifi': dept.description || 'Mavjud emas',
				'Boshlig\'i': dept.head ? dept.head.fullName : 'Tayinlanmagan',
				'Lavozimi': dept.head ? dept.head.position : 'Tayinlanmagan',
				'Yaratilgan sana': new Date(dept.createdAt).toLocaleDateString('uz-UZ'),
			}))

			const ws = XLSX.utils.json_to_sheet(exportData)
			const wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, "Bo'limlar")
			XLSX.writeFile(wb, `bo'limlar_${new Date().toISOString().slice(0, 10)}.xlsx`)
			toast.success("Excel fayliga yuklandi!")
		} catch (error) {
			toast.error("Export qilishda xatolik")
		} finally {
			setExportLoading(false)
		}
	}

	// Filter departments
	const filteredDepartments = departments.filter(dept =>
		dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
		(dept.head && dept.head.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
	)

	useEffect(() => {
		fetchDepartments()
		fetchUsers()
	}, [])

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
			<div className="mx-auto">
				{/* Dashboard Header */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-800 flex items-center">
							<FiHome className="mr-3 text-indigo-800" />
							<span className="text-indigo-700">Bo'limlar Boshqaruvi</span>
						</h1>
					</div>
					<div className="mt-4 md:mt-0 flex space-x-3">
						<button
							onClick={() => {
								resetForm()
								setActiveTab('list')
							}}
							className={`px-4 py-2 rounded-xl font-medium flex items-center transition-all ${activeTab === 'list' ? 'bg-white shadow-md text-blue-600' : 'bg-white/70 hover:bg-white text-gray-600 hover:text-gray-800'}`}
						>
							<FiFileText className="mr-2" /> Ro'yxat
						</button>
						<button
							onClick={() => {
								resetForm()
								setActiveTab('create')
							}}
							className={`px-4 py-2 rounded-xl font-medium flex items-center transition-all ${activeTab === 'create' ? 'bg-white shadow-md text-blue-600' : 'bg-white/70 hover:bg-white text-gray-600 hover:text-gray-800'}`}
						>
							<FiPlus className="mr-2" /> {editingId ? "Tahrirlash" : "Yangi bo'lim"}
						</button>
					</div>
				</div>

				{/* Main Content */}
				<div className="bg-white rounded-2xl shadow-xl overflow-hidden">
					{activeTab === 'list' ? (
						<div className="p-6">
							{/* Search and Actions Bar */}
							<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
								<div className="relative w-full md:w-96">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<FiSearch className="h-5 w-5 text-gray-400" />
									</div>
									<input
										type="text"
										placeholder="Bo'lim nomi, boshliq yoki tavsif bo'yicha qidirish..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="block w-full pl-10 pr-3 py-3 text-black border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
									/>
								</div>
								<button
									onClick={exportToExcel}
									disabled={exportLoading || departments.length === 0}
									className={`px-4 py-3 rounded-xl font-medium flex items-center transition-all ${departments.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
								>
									<FiDownload className="mr-2" />
									{exportLoading ? 'Yuklanmoqda...' : 'Excelga yuklash'}
								</button>
							</div>

							{/* Stats Cards */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
								<div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
									<div className="flex items-center">
										<div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
											<FiUsers className="w-6 h-6" />
										</div>
										<div>
											<p className="text-sm text-gray-500">Jami bo'limlar</p>
											<p className="text-2xl font-bold text-gray-800">{departments.length}</p>
										</div>
									</div>
								</div>
								<div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
									<div className="flex items-center">
										<div className="p-3 rounded-lg bg-purple-100 text-purple-600 mr-4">
											<FiUser className="w-6 h-6" />
										</div>
										<div>
											<p className="text-sm text-gray-500">Boshliqlar</p>
											<p className="text-2xl font-bold text-gray-800">
												{departments.filter(d => d.head).length}
											</p>
										</div>
									</div>
								</div>
								<div className="bg-green-50 p-4 rounded-xl border border-green-100">
									<div className="flex items-center">
										<div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4">
											<FiFileText className="w-6 h-6" />
										</div>
										<div>
											<p className="text-sm text-gray-500">Faol bo'limlar</p>
											<p className="text-2xl font-bold text-gray-800">{departments.length}</p>
										</div>
									</div>
								</div>
							</div>

							{isLoading ? (
								<div className="flex justify-center py-12">
									<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
								</div>
							) : filteredDepartments.length === 0 ? (
								<div className="text-center py-12">
									<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
										<FiFileText className="w-8 h-8" />
									</div>
									<h3 className="text-xl font-medium text-gray-900 mb-2">
										{searchTerm ? "Hech narsa topilmadi" : "Bo'limlar mavjud emas"}
									</h3>
									<p className="text-gray-500 mb-6">
										{searchTerm ? "Boshqa kalit so'zlar bilan qayta urinib ko'ring" : "Yangi bo'lim qo'shish uchun 'Yangi bo'lim' tugmasini bosing"}
									</p>
									{!searchTerm && (
										<button
											onClick={() => setActiveTab('create')}
											className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-xl shadow-md text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
										>
											<FiPlus className="mr-2" /> Yangi bo'lim qo'shish
										</button>
									)}
								</div>
							) : (
								<div className="overflow-hidden border border-gray-200 rounded-xl">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50 hidden md:table-header-group">
											<tr>
												<th
													scope="col"
													className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													№
												</th>
												<th
													scope="col"
													className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Nomi
												</th>
												<th
													scope="col"
													className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Boshlig'i
												</th>
												<th
													scope="col"
													className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
												>
													Harakatlar
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{filteredDepartments.map((dept, index) => (
												<tr
													key={dept._id}
													className="hover:bg-gray-50 transition-colors flex flex-col md:table-row"
												>
													{/* № faqat md ekranlarda */}
													<td className="px-6 py-4 text-sm font-medium text-gray-900 hidden md:table-cell">
														{index + 1}
													</td>

													{/* Nomi */}
													<td className="px-6 py-4 whitespace-normal break-words">
														<div className="flex items-center">
															<div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
																<FiHome className="w-5 h-5" />
															</div>
															<div>
																<div className="text-sm font-medium text-gray-900">
																	{dept.name}
																</div>
																{/* Description faqat md ekranlarda */}
																{dept.description && (
																	<div className="text-xs text-gray-500 mt-1 break-words hidden md:block">
																		{dept.description}
																	</div>
																)}
															</div>
														</div>
													</td>

													{/* Boshlig'i */}
													<td className="px-6 py-4 whitespace-normal break-words">
														{dept.head ? (
															<div className="flex items-center">
																{/* Photo faqat md ekranlarda */}
																{dept.head.photo ? (
																	<img
																		className="h-10 w-10 rounded-full object-cover hidden md:block"
																		src={`${import.meta.env.VITE_BASE_URL}/uploads/${dept.head.photo}`}
																		alt={dept.head.fullName}
																	/>
																) : (
																	<div className="h-10 w-10 rounded-full bg-purple-100 hidden md:flex items-center justify-center text-purple-600 font-medium">
																		{dept.head.fullName.charAt(0)}
																	</div>
																)}
																<div className="ml-0 md:ml-4">
																	{/* FullName hamma ekranlarda chiqadi */}
																	<div className="text-sm font-medium text-gray-900 break-words">
																		{dept.head.fullName}
																	</div>
																	{/* Position faqat md ekranlarda */}
																	<div className="text-xs text-gray-500 break-words hidden md:block">
																		{dept.head.position}
																	</div>
																</div>
															</div>
														) : (
															<span className="text-sm text-gray-500 italic">Tayinlanmagan</span>
														)}
													</td>

													{/* Harakatlar */}
													<td className="px-6 py-4 whitespace-normal break-words text-right text-sm font-medium">
														<button
															onClick={() => handleEdit(dept)}
															className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
															title="Tahrirlash"
														>
															<FiEdit className="h-5 w-5" />
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>


							)}
						</div>
					) : (
						<div className="p-8">
							<div className="mx-auto">
								<form onSubmit={handleSubmit} className="space-y-6">
									<div className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
										{/* Department Name */}
										<div>
											<label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
												Bo'lim nomi <span className="text-red-500">*</span>
											</label>
											<div className="mt-1 relative rounded-lg shadow-sm">
												<input
													type="text"
													id="name"
													value={name}
													onChange={(e) => setName(e.target.value)}
													placeholder="Kompyuterlashtirish markazi"
													className="block w-full px-4 py-3 text-black border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
													required
												/>
												<div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
													<FiHome className="h-5 w-5 text-gray-400" />
												</div>
											</div>
										</div>

										{/* Department Head */}
										<div>
											<label htmlFor="head" className="block text-sm font-medium text-gray-700 mb-2">
												Bo'lim boshlig'i
											</label>
											<select
												id="head"
												onChange={(e) => setHead(users.find(u => u._id === e.target.value))}
												value={head?._id || ''}
												className="mt-1 block w-full pl-3 pr-10 text-black py-3 text-base border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
											>
												<option value="">Boshliqni tanlang</option>
												{users.map(user => (
													<option key={user._id} value={user._id}>
														{user.fullName} ({user.position})
													</option>
												))}
											</select>
											{head && (
												<div className="mt-3 inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
													<FiUser className="mr-2" /> {head.fullName} ({head.position})
												</div>
											)}
										</div>

										{/* Description */}
										<div>
											<label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
												Tavsif
											</label>
											<textarea
												id="description"
												value={description}
												onChange={(e) => setDescription(e.target.value)}
												placeholder="Bo'lim vazifalari va maqsadlari..."
												rows={4}
												className="block w-full px-4 py-3 text-black border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
											/>
										</div>
									</div>

									<div className="flex justify-center space-x-4 pt-6">
										<button
											type="button"
											onClick={() => {
												resetForm()
												setActiveTab('list')
											}}
											className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
										>
											<FiX className="mr-2" /> Bekor qilish
										</button>
										<button
											type="submit"
											disabled={isLoading}
											className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-md text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
										>
											{isLoading ? (
												<>
													<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
													{editingId ? "Saqlanmoqda..." : "Qo'shilmoqda..."}
												</>
											) : (
												<>
													<FiCheck className="mr-2" /> {editingId ? "Saqlash" : "Qo'shish"}
												</>
											)}
										</button>
									</div>
								</form>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default Department