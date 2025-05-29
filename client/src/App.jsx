import React from 'react'
import { Route, Routes, useMatch } from 'react-router-dom'
import Home from './pages/student/Home'
import CoursesList from './pages/student/CoursesList'
import CourseDetails from './pages/student/CourseDetails'
import MyEnrollments from './pages/student/MyEnrollments'
import Player from './pages/student/Player'
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourse from './pages/educator/AddCourse'
import MyCourses from './pages/educator/MyCourses'
import StudentsEnrolled from './pages/educator/StudentsEnrolled'
import Navbar from './components/student/Navbar'
import Login from './pages/student/Login'
import ProtectedRoute from './components/auth/ProtectedRoute'
import "quill/dist/quill.snow.css";

const App = () => {
  const isEducatorRoute = useMatch('/educator/*');
  const token = localStorage.getItem('token');

  return (
    <div className='text-default min-h-screen bg-white'>
      {!isEducatorRoute && <Navbar/>}
      <Routes>
        {/* Public Routes */}
        <Route path='/login' element={<Login />} />
        <Route path='/' element={<Home/>}/>
        <Route path='/course-list' element={<CoursesList/>}/>
        <Route path='/course-list/:input' element={<CoursesList/>}/>
        <Route path='/course/:id' element={<CourseDetails/>}/>

        {/* Protected Student Routes */}
        <Route path='/my-enrollments' element={
          <ProtectedRoute>
            <MyEnrollments/>
          </ProtectedRoute>
        }/>
        <Route path='/player/:courseId' element={
          <ProtectedRoute>
            <Player/>
          </ProtectedRoute>
        }/>

        {/* Protected Educator Routes */}
        <Route path='/educator' element={
          <ProtectedRoute requireEducator={true}>
            <Educator/>
          </ProtectedRoute>
        }>
          <Route path='/educator' element={<Dashboard/>} />
          <Route path='add-course' element={<AddCourse/>} />
          <Route path='my-courses' element={<MyCourses/>} />
          <Route path='student-enrolled' element={<StudentsEnrolled/>} />
        </Route>
      </Routes>
    </div>
  )
}

export default App