import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AppContext } from '../../context/AppContext';
import Footer from '../../components/student/Footer';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { backendUrl, setToken, setUserData } = useContext(AppContext);

  const [currentState, setCurrentState] = useState('Login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      // User is already logged in, redirect to home or intended page
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo);
    }
  }, [navigate, location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const endpoint = currentState === 'Login' ? '/api/user/login' : '/api/user/register';
      const { data } = await axios.post(backendUrl + endpoint, formData);

      if (data.success && data.user && data.token) {
        if (!data.user._id) {
          throw new Error('Invalid user data received');
        }
        
        // Set token and user data
        setToken(data.token);
        setUserData(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Show success message
        toast.success(currentState === 'Login' ? 'Login successful!' : 'Registration successful!');

        // Redirect to home or intended page
        const redirectTo = location.state?.from || '/';
        navigate(redirectTo);
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.response?.data?.message || error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='bg-gradient-to-b from-cyan-100/70 pt-24 min-h-screen'>
      <form
        onSubmit={onSubmitHandler}
        className='flex flex-col w-[90%] sm:max-w-100 m-auto gap-4 text-teal-800 border p-8 shadow-2xl shadow-teal-200 rounded-2xl'
      >
        <div className='flex items-center justify-center gap-2 mb-2 mt-8'>
          <p className='text-3xl'>{currentState}</p>
        </div>
        {currentState === 'Login' ? null : (
          <input
            type='text'
            name='name'
            value={formData.name}
            onChange={handleChange}
            className='w-full px-3 py-2 border focus:border-2 focus:border-teal-600 outline-none rounded-lg'
            placeholder='Name'
            required
          />
        )}
        <input
          type='email'
          name='email'
          value={formData.email}
          onChange={handleChange}
          className='w-full px-3 py-2 border focus:border-2 focus:border-teal-600 outline-none rounded-lg'
          placeholder='Email'
          required
        />
        <input
          type='password'
          name='password'
          value={formData.password}
          onChange={handleChange}
          className='w-full px-3 py-2 border focus:border-2 focus:border-teal-600 outline-none rounded-lg'
          placeholder='Password'
          required
        />
        <div className='flex w-full justify-between text-sm mt-[-5px]'>
          <p className='cursor-pointer text-teal-800'>Forgot your password?</p>
          {currentState === 'Login' ? (
            <p onClick={() => setCurrentState('Sign Up')} className='cursor-pointer text-teal-800'>
              Create an account
            </p>
          ) : (
            <p onClick={() => setCurrentState('Login')} className='cursor-pointer text-teal-800'>
              Login here
            </p>
          )}
        </div>
        <button
          disabled={loading}
          className={`${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          } bg-teal-600 text-white font-light px-8 py-2 mt-4 rounded-lg hover:bg-teal-700 transition-colors`}
        >
          {loading ? 'Please wait...' : currentState === 'Login' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
      <Footer />
    </div>
  );
};

export default Login;