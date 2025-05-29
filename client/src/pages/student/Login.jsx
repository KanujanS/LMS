import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AppContext } from '../../context/AppContext';
import Footer from '../../components/student/Footer';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { backendUrl } = useContext(AppContext);

  const [currentState, setCurrentState] = useState('Login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  // Set axios default Authorization header if token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // Clear any existing auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];

      const endpoint = currentState === 'Login' ? '/api/user/login' : '/api/user/register';
      const { data } = await axios.post(backendUrl + endpoint, formData);

      if (data.success && data.user && data.token) {
        if (!data.user._id) {
          throw new Error('Invalid user data received');
        }

        // Save token and user to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Set axios Authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

        toast.success(`${currentState} successful!`);

        // Redirect to the intended page or home
        const redirectTo = location.state?.from || '/';
        navigate(redirectTo);
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
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