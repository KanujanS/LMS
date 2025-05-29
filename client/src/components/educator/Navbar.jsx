import React from "react";
import { assets } from "../../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="flex items-center justify-between px-4 md:px-8 border-b border-gray-500 py-3">
      <Link to='/'> 
        <img src={assets.logo} alt="logo" className="w-28 lg:w-32"/>
      </Link>
      <div className="flex items-center gap-5 text-gray-500 relative">
        <p>Hi! {user?.name || 'Educator'}</p>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 hover:text-gray-700"
        >
          <img className="max-w-8 rounded-full" src={user?.imageUrl || assets.profile_img} alt="profile"/>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
