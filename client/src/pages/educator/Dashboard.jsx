import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import api from '../../utils/api'
import { toast } from 'react-hot-toast'
import { BsPersonSquare } from "react-icons/bs";
import { GiMoneyStack } from "react-icons/gi";
import { SiDiscourse } from "react-icons/si";

const Dashboard = () => {

  const navigate = useNavigate()
  const { userData, backendUrl, currency } = useContext(AppContext)
  const [ loading, setLoading ] = useState(true)
  const [ dashboardData, setDashboardData ] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/educator/dashboard');
        console.log('Dashboard response:', response.data); // Debug log
        
        if (response.data.success) {
          const dashboardData = response.data.data || {};
          setDashboardData({
            enrolledStudentsData: dashboardData.enrolledStudents || [],
            totalCourses: dashboardData.totalCourses || 0,
            totalEarnings: dashboardData.totalEarnings || 0
          });
        } else {
          console.error('API Error:', response.data);
          toast.error(response.data.message || 'Failed to fetch dashboard data');
        }
      } catch (error) {
        console.error('Dashboard error:', error);
        // Check if it's a network error
        if (!error.response) {
          toast.error('Network error. Please check your connection.');
          return;
        }
        
        // Handle specific error cases
        if (error.response.status === 401) {
          toast.error('Session expired. Please login again.');
          navigate('/login');
          return;
        }
        
        if (error.response.status === 403) {
          toast.error('You need educator access for this page');
          navigate('/');
          return;
        }
        
        toast.error(error.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return <Loading />
  }

  if (!dashboardData) {
    return <div className="p-4">Failed to load dashboard data</div>
  }

  return (
    <div className='min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='space-y-5'>
        <div className='flex flex-wrap gap-5 items-center'>
          <div className='flex items-center gap-3 shadow-card border border-teal-500 p-4 w-56 rounded-md'>
            <BsPersonSquare className="text-teal-500 cursor-pointer border rounded p-1" size={50}/>
            <div>
              <p className='text-2xl font-medium text-gray-600'>{dashboardData.enrolledStudentsData.length}</p>
              <p className='text-base text-gray-500'>Total Enrolments</p>
            </div>
          </div>
          <div className='flex items-center gap-3 shadow-card border border-teal-500 p-4 w-56 rounded-md'>
            <SiDiscourse className="text-teal-500 cursor-pointer border rounded p-1" size={50}/>
            <div>
              <p className='text-2xl font-medium text-gray-600'>{dashboardData.totalCourses}</p>
              <p className='text-base text-gray-500'>Total Courses</p>
            </div>
          </div>
          <div className='flex items-center gap-3 shadow-card border border-teal-500 p-4 w-56 rounded-md'>
            <GiMoneyStack className="text-teal-500 cursor-pointer border rounded p-1" size={50}/>
            <div>
              <p className='text-2xl font-medium text-gray-600'>{currency}{dashboardData.totalEarnings}</p>
              <p className='text-base text-gray-500'>Total Earnings</p>
            </div>
          </div>
        </div>
        <div>
          <h2 className='pb-4 text-lg font-medium'>Latest Enrollments</h2>
          <div className='flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-teal-500/20'>
            <table className='table-fixed md:table-auto w-full overflow-hidden'>
              <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left'>
                <tr>
                  <th className='px-4 py-3 font-semibold text-center hidden sm:table-cell'>#</th>
                  <th className='px-4 py-3 font-semibold'>Student Name</th>
                  <th className='px-4 py-3 font-semibold'>Course Title</th>
                </tr>
              </thead>
              <tbody className='text-sm text-gray-500'>
                {dashboardData.enrolledStudentsData.map((item,index)=>(
                  <tr key={index} className='border-b border-gray-500/20'>
                    <td className='px-4 py-3 text-center hidden sm:table-cell'>{index + 1}</td>
                    <td className='md:px-4 px-2 py-3 flex items-center space-x-3'>
                      <img src={item.student.imageUrl} alt='profile' className='w-9 h-9 rounded-full'/>
                      <span className='truncate'>{item.student.name}</span>
                    </td>
                    <td className='px-4 py-3 truncate'>{item.courseTitle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;