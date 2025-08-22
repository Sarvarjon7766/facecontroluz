import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, allowedRoles }) => {
	const role = localStorage.getItem('content-type')

	if (!role) {
		return <Navigate to="/" />
	}

	if (!allowedRoles.includes(role)) {
		return <Navigate to="/" />
	}
	return children
}

export default ProtectedRoute
