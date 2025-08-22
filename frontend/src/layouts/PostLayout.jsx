import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import PostNavbar from '../components/PostNavbar'
import PostSidebar from '../components/PostSidebar'
const PostLayout = () => {
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
			<aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transform fixed md:static inset-y-0 left-0 z-30 
        w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out`}>
				<div className="h-full flex flex-col border-r border-gray-200">
					<PostSidebar />
				</div>
			</aside>
			<div className="flex-1 flex flex-col overflow-hidden">
				<PostNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

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

export default PostLayout
