import React, { useContext } from 'react'
import {assets} from '../../assets/assets'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CgProfile } from "react-icons/cg";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData: user, logout, setUserData } = useContext(AppContext);

  const isCourseListPage = location.pathname.includes('/course-list');

  const becomeEducator = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!user || !token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      if (user.role === 'educator') {
        navigate('/educator');
        return;
      }

      const { data } = await axios.get('/api/educator/update-role', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        // Update local storage first
        const updatedUser = { ...user, role: 'educator' };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Show success message
        toast.success('Successfully became an educator!');
        
        // Update context and navigate last
        setUserData(updatedUser);
        setTimeout(() => navigate('/educator'), 100);
      } else {
        toast.error(data.message || 'Failed to become an educator');
      }
    } catch (error) {
      console.error('Error becoming educator:', error);
      const errorMsg = error.response?.data?.message || 'Failed to become an educator';
      toast.error(errorMsg);
      
      if (error.response?.status === 401) {
        setTimeout(() => navigate('/login'), 100);
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${isCourseListPage ? 'bg-white' : 'bg-cyan-100/70'}`}>
      <img onClick={()=>navigate('/')} src={assets.logo} alt="Logo" className='w-34 lg:w-42 cursor-pointer'/>
      <div className='hidden md:flex items-center gap-5 text-gray-500'>
        <div className='flex items-center gap-5'>
          {user && (
            <>
              <button 
                onClick={becomeEducator} 
                className='cursor-pointer'
              >
                {user.role === 'educator' ? 'Educator Dashboard' : 'Become Educator'}
              </button>
              | <Link to='/my-enrollments'>My Enrollments</Link>
            </>
          )}
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span>Hi, {user.name}</span>
            <button onClick={handleLogout} className="cursor-pointer">
              <div className="group relative flex flex-col items-center">
                <CgProfile className="w-7 h-7 text-teal-500"/>
                <span className="absolute top-10 text-sm bg-teal-200 px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-700">Logout</span>
              </div>
            </button>
          </div>
        ) : (
          <Link 
            to="/login" 
            className='bg-teal-600 text-white px-5 py-2 rounded-full hover:bg-teal-700'
          >
            Login
          </Link>
        )}
      </div>
      <div className='md:hidden flex items-center gap-2 sm:gap-5 text-gray-500'>
        <div className='flex items-center gap-1 sm:gap-2 max-sm:text-xs'>
          {user && (
            <>
              <button 
                onClick={becomeEducator} 
                className='cursor-pointer'
              >
                {user.role === 'educator' ? 'Dashboard' : 'Become Educator'}
              </button>
              | <Link to='/my-enrollments'>Enrollments</Link>
            </>
          )}
          {user ? (
            <button 
              onClick={handleLogout}
              className="flex items-center"
            >
              <img 
                className="w-8 h-8 rounded-full" 
                src={user.imageUrl || assets.profile_img} 
                alt="profile"
              />
            </button>
          ) : (
            <Link to="/login">
              <img src={assets.user_icon} alt="login" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navbar;