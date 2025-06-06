import React from 'react'
import { assets } from '../../assets/assets'
import { Link } from 'react-router-dom'

const CallToAction = () => {
  return (
    <div className='flex flex-col items-center gap-4 pt-10 pb-24 px-8 m-5 md:px-10 border border-gray-300 rounded-lg bg-white shadow-lg shadow-black/10'>
        <h1 className='text-xl md:text-4xl text-gray-800 font-semibold'>Learn anything, anytime, anywhere</h1>
        <p className='text-gray-500 sm:text-sm'>“Unlock knowledge at your fingertips—learn anytime, anywhere, and achieve your goals on your terms.”</p>
        <div className='flex items-center font-medium gap-6 mt-4'>
          <Link to='/course-list'>
            <button className='px-10 py-3 rounded-md text-white bg-teal-600 cursor-pointer'>Get Started</button>
          </Link>
          <button className='flex items-center gap-2'>Learn More <img src={assets.arrow_icon} alt="arrow_icon" /></button>
        </div>
    </div>
  )
}

export default CallToAction