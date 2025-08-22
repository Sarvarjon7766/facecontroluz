import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import UserNavbar from '../components/UserNavbar'

const UserLayout = () => {
	const navigate = useNavigate()
	const [sidebarOpen, setSidebarOpen] = useState(false)

	useEffect(() => {
		const token = localStorage.getItem('token')
		if (!token) {
			navigate('/')
		}
	}, [navigate])

	return (
		<div className="flex h-screen bg-gray-50 overflow-hidden">
			<div className="flex-1 flex flex-col overflow-hidden">
				<UserNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

				<main className="flex-1 overflow-y-auto bg-gray-50">
					<div className="max-w-screen-2xl mx-auto p-4 md:p-6">
						<Outlet />
					</div>
				</main>
			</div>
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-blur-50 z-20 md:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}
		</div>
	)
}

export default UserLayout
