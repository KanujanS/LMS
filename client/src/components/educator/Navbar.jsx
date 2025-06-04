import React from "react";
import { assets } from "../../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import { CgProfile } from "react-icons/cg";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
    }
  };

  return (
    <div className="flex items-center justify-between px-4 md:px-8 border-b border-gray-500 py-3">
      <Link to='/'> 
        <img src={assets.logo} alt="logo" className="w-28 lg:w-32"/>
      </Link>
      <div className="flex items-center gap-3 text-gray-500 relative">
        <p>Hi, {user?.name || 'Educator'}</p>
        <button onClick={handleLogout} className="cursor-pointer">
          <div className="group relative flex flex-col items-center">
            <CgProfile className="w-7 h-7 text-teal-500"/>
            <span className="absolute top-10 text-sm bg-teal-200 px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-700">Logout</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
