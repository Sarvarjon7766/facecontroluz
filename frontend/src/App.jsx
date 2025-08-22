import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Profile from './components/Profile'
import ProtectedRoute from './context/ProtectedRoute'
import { AdminAttandance, AdminEntryExit, AdminPost, AdminUsers, Departament } from './pages/admin/index'
import PostMonitor from './pages/post/PostManitor'
import PostUsers from './pages/post/PostUsers'
import { UserAttandance, UserDepartment, UserUsers } from './pages/user/index'

import Login from './components/Login'
import Logout from './components/Logout'

import AdminLayout from './layouts/AdminLayout'
import PostLayout from './layouts/PostLayout'
import UserLayout from './layouts/UserLayout'

const App = () => {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/logout" element={<Logout />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Departament />} />
          <Route path='departament' element={<Departament />} />
          <Route path='users' element={<AdminUsers />} />
          <Route path='attandance' element={<AdminAttandance />} />
          <Route path='post' element={<AdminPost />} />
          <Route path='entry-exit' element={<AdminEntryExit />} />
          <Route path='profile' element={<Profile />} />
        </Route>

        <Route
          path="/viewer"
          element={
            <ProtectedRoute allowedRoles={['viewer']}>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserAttandance />} />
          <Route path='departament' element={<UserDepartment />} />
          <Route path='users' element={<UserUsers />} />
          <Route path='attandance' element={<UserAttandance />} />
          <Route path='profile' element={<Profile />} />
        </Route>
        <Route
          path="/post"
          element={
            <ProtectedRoute allowedRoles={['post']}>
              <PostLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PostUsers />} />
          <Route path='departament' element={<UserDepartment />} />
          <Route path='users' element={<UserUsers />} />
          <Route path='attandance' element={<PostUsers />} />
          <Route path='profile' element={<Profile />} />
        </Route>
        <Route path='manitor' element={<PostMonitor />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
