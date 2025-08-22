import axios from 'axios'
import { useEffect, useState } from 'react'
import { FiArrowLeft, FiClock, FiLogIn, FiLogOut, FiUser } from 'react-icons/fi'
import { ToastContainer, toast } from 'react-toastify'

const PostMonitor = () => {
	const [log, setLog] = useState(null)
	const [selectedPost, setSelectedPost] = useState(1)
	const [isLoading, setIsLoading] = useState(false)
	const token = localStorage.getItem('token')

	const fetchLog = async () => {
		setIsLoading(true)
		try {
			const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/post/getByPost/${selectedPost}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (res.data.success) {
				setLog(res.data.log)
			} else {
				setLog(null)
			}
		} catch (error) {
			toast.error('Tizimga kiring')
			setLog(null)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchLog()
		// Auto-refresh every 30 seconds
		const interval = setInterval(fetchLog, 3000)
		return () => clearInterval(interval)
	}, [selectedPost])

	const formatTime = (dateString) => {
		const date = new Date(dateString)
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	}

	const formatDateTime = (dateString) => {
		const date = new Date(dateString)
		return date.toLocaleString([], {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	return (
		<div className="min-h-screen bg-gray-100">
			<ToastContainer position="top-right" autoClose={5000} />
			<button
				onClick={() => window.history.back()}
				className="absolute top-4 left-4 z-20 bg-white bg-opacity-90 rounded-full p-3 shadow-md hover:bg-gray-100 transition-colors"
				aria-label="Orqaga qaytish"
			>
				<FiArrowLeft className="text-xl text-gray-700" />
			</button>

			{/* Subtle Post Selection in top right */}
			<div className="absolute top-4 right-4 z-10">
				<div className="bg-white bg-opacity-90 rounded-full shadow-md p-1 inline-flex backdrop-blur-sm">
					<button
						onClick={() => setSelectedPost(1)}
						className={`px-4 py-2 rounded-full transition-all text-sm ${selectedPost === 1 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
					>
						Post 1
					</button>
					<button
						onClick={() => setSelectedPost(2)}
						className={`px-4 py-2 rounded-full transition-all text-sm ${selectedPost === 2 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
					>
						Post 2
					</button>
				</div>
			</div>

			{/* Main Content - Full Screen Employee Display */}
			<div className="h-screen flex flex-col justify-center items-center p-8">
				{isLoading ? (
					<div className="flex justify-center items-center h-full">
						<div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-500"></div>
					</div>
				) : !log ? (
					<div className="text-center">
						<FiUser className="mx-auto text-8xl mb-6 text-gray-300" />
						<p className="text-3xl text-gray-500">Hozircha hech qanday yozuv mavjud emas</p>
					</div>
				) : (
					<div className="w-full max-w-6xl">
						<div className="flex flex-col lg:flex-row items-center justify-center gap-12">
							{/* Large Employee Photo */}
							<div className="relative">
								<div className="h-64 w-64 rounded-full overflow-hidden border-8 border-white shadow-2xl">
									{log.photo ? (
										<img
											src={`${import.meta.env.VITE_BASE_URL}/uploads/${log.photo}`}
											alt={log.fullName}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="h-full w-full bg-gray-200 flex items-center justify-center">
											<FiUser className="text-gray-500 text-8xl" />
										</div>
									)}
								</div>
								<div className={`absolute -bottom-4 -right-4 h-14 w-14 rounded-full border-4 border-white flex items-center justify-center ${log.typeStatus ? 'bg-green-500' : 'bg-red-500'}`}>
									{log.typeStatus ? (
										<FiLogIn className="text-white text-xl" />
									) : (
										<FiLogOut className="text-white text-xl" />
									)}
								</div>
							</div>

							{/* Employee Information */}
							<div className="flex-1 text-center lg:text-left">
								<h1 className="text-5xl font-bold text-gray-800 mb-4">{log.fullName}</h1>
								<h2 className="text-3xl text-gray-600 mb-8">{log.position}</h2>

								<div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-2xl ${log.typeStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
									{log.typeStatus ? (
										<>
											<FiLogIn className="text-green-600 text-2xl" />
											<span className="font-bold">Ishga kirdi</span>
										</>
									) : (
										<>
											<FiLogOut className="text-red-600 text-2xl" />
											<span className="font-bold">Ishdan chiqdi</span>
										</>
									)}
								</div>

								{/* Time and Date */}
								<div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
									<div className="flex items-center gap-3 text-gray-600 bg-gray-100 rounded-xl px-6 py-4">
										<FiClock className="text-3xl" />
										<div>
											<p className="text-xl">Vaqt:</p>
											<p className="text-2xl font-bold">{formatTime(log.updatedAt)}</p>
										</div>
									</div>
									<div className="text-xl text-gray-500">
										{formatDateTime(log.updatedAt)}
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default PostMonitor