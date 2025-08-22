import { FaCheckDouble, FaUsers } from 'react-icons/fa'
import { FaBuildingCircleCheck } from "react-icons/fa6"
import { FiLogOut } from 'react-icons/fi'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const UserSidebar = () => {
	const navigate = useNavigate()
	const location = useLocation()

	const handleLogout = () => {
		navigate('/logout')
	}

	// Function to check if a link is active
	const isActive = (path) => {
		return location.pathname === path ||
			(path !== '/viewer' && location.pathname.startsWith(path))
	}

	return (
		<aside className="w-64 h-screen bg-blue-800 text-white p-5 border-r border-gray-200 flex flex-col">
			<div className="mb-8">
				<h2 className="text-2xl font-bold text-white flex items-center">
					<span className="bg-none text-white p-2 rounded-lg mr-3">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="#3B82F6" strokeWidth="2" />
							<path d="M8 12h8m-8 4h8m-8-8h8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
						</svg>
					</span>
					Face Control
				</h2>
			</div>

			<nav className="flex-1 space-y-2">
				<Link
					to="/viewer/attandance"
					className={`flex items-center p-3 rounded-lg transition-colors group ${isActive('/viewer/attandance') ? 'bg-blue-50 text-blue-600' : 'hover:bg-blue-50 hover:text-blue-600'
						}`}
				>
					<FaBuildingCircleCheck className={`mr-3 ${isActive('/viewer/attandance') ? 'text-blue-600' : 'text-blue-500 group-hover:text-blue-600'
						}`} />
					<span className="font-medium">Nazorat</span>
				</Link>
			</nav>

			<div className="mt-auto">
				<button
					onClick={handleLogout}
					className="flex items-center w-full p-3 rounded-lg hover:bg-red-50 cursor-pointer hover:text-red-600 transition-colors group"
				>
					<FiLogOut className="text-gray-500 mr-3 group-hover:text-red-500" />
					<span className="font-medium">Chiqish</span>
				</button>
			</div>
		</aside>
	)
}

export default UserSidebar
