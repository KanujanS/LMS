import React from 'react'
import { assets } from '../../assets/assets'
import { FaFacebook } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className='bg-gray-900 md:px-36 text-left w-full mt-10'>
        <div className='flex flex-col md:flex-row items-start px-8 md:px-0 justify-center gap-10 md:gap-20 py-10 border-b border-white/30'>
          <div className='flex flex-col md:items-start w-full'>
            <img className='w-45' src={assets.logo_dark} alt="logo" />
            <p className='mt-6 md:text-left text-sm text-white/80'>“Our LMS project offers a seamless learning experience with interactive courses and real-time progress tracking”</p>
          </div>
          <div className='flex flex-col pl-0 lg:pl-15 md:items-start w-full'>
            <h2 className='font-semibold text-white mb-5'>Company</h2>
            <ul className='flex flex-col w-full justify-between text-sm text-white/80 md:space-y-2 '>
              <li className='hover:text-white'><a href="#">Home</a></li>
              <li className='hover:text-white'><a href="#">About us</a></li>
              <li className='hover:text-white'><a href="#">Contact us</a></li>
              <li className='hover:text-white'><a href="#">Privacy policy</a></li>
            </ul>
          </div>
          <div className='flex flex-col md:items-start  w-full'>
            <h2 className='font-semibold text-white mb-5'>Get In Touch</h2>
            <ul className='flex flex-col w-full justify-between text-sm text-white/80 md:space-y-2'>
              <li className='flex flex-row gap-2 hover:text-white cursor-pointer'><FaFacebook className='mt-[3px]'/>Facebook</li>
              <li className='flex flex-row gap-2 hover:text-white cursor-pointer'><FaInstagram className='mt-[4px]'/>Instagram</li>
              <li className='flex flex-row gap-2 hover:text-white cursor-pointer'><FaLinkedin className='mt-[3px]'/>LinkedIn</li>
              <li className='flex flex-row gap-2 hover:text-white cursor-pointer'><FaYoutube className='mt-[3px]'/>YouTube</li>
            </ul>
          </div>
          <div className='md:flex flex-col items-start w-full'>
            <h2 className='font-semibold text-white mb-5'>Subscribe to our newsletter</h2>
            <p className='text-sm text-white/80'>The latest news, articles, and resources, sent to your inbox weekly.</p>
            <div className='flex items-center gap-2 pt-4'>
              <input type="email" placeholder='Enter your email' className='border border-gray-500/30 text-gray-500 placeholder-gray-500 outline-none w-64 h-9 rounded px-2 text-sm'/>
              <button className='bg-teal-600 w-24 h-9 text-white rounded cursor-pointer'>Subscribe</button>
            </div>
          </div>
        </div>
        <p className='py-4 text-center text-xs md:text-sm text-white/60'>Copyright 2025 &#169; LearnGate. All Rights Reserved</p>
    </footer>
  )
}

export default Footer