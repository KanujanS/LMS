import React, { useContext } from 'react'
import {assets} from '../../assets/assets'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {backendUrl} = useContext(AppContext);

  const isCourseListPage = location.pathname.includes('/course-list');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem('token');

  const becomeEducator = async () => {
    try {
      if (!user || !token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      if (user.role === 'educator') {
        navigate('/educator')
        return;
      }
      const { data } = await axios.get(backendUrl + '/api/educator/update-role', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        const updatedUser = { ...user, role: 'educator' };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success(data.message);
        navigate('/educator');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
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
            <span>Hi, {user.name}!</span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 cursor-pointer hover:text-gray-700"
            >
              <img 
                className="w-8 h-8 rounded-full" 
                src={user.imageUrl || assets.profile_img} 
                alt="profile"
              />
              <span>Logout</span>
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