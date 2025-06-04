import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import Footer from '../../components/student/Footer'
import YouTube from 'react-youtube'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const CourseDetails = () => {
  const { id } = useParams()

  const [courseData, setCourseData] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(true)
  const [playerData, setPlayerData] = useState(null)
  const [loadingEnroll, setLoadingEnroll] = useState(false)

  const {
    allCourses,
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    currency,
    backendUrl,
    userData,
    getToken,
  } = useContext(AppContext)

  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/course/' + id)
      if (data.success) {
        setCourseData(data.courseData)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const enrollCourse = async () => {
    try {
      if (!userData) {
        return toast.warn('Login to Enroll')
      }
      if (isAlreadyEnrolled) {
        return toast.warn('Already Enrolled')
      }

      setLoadingEnroll(true)

      const token = await getToken()
      const { data } = await axios.post(
        backendUrl + '/api/user/purchase',
        { courseId: courseData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        const { session_url } = data
        // Store course ID in localStorage before redirecting
        localStorage.setItem('pendingEnrollmentCourseId', courseData._id)
        window.location.replace(session_url)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoadingEnroll(false)
    }
  }

  useEffect(() => {
    const handlePaymentStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment_success');
      const paymentCancelled = urlParams.get('payment_cancelled');

      if (paymentSuccess === 'true') {
        // Wait for webhook processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check enrollment status with retries
        let retryCount = 0;
        const maxRetries = 5;
        const checkEnrollment = async () => {
          try {
            const token = await getToken();
            const response = await axios.get(
              backendUrl + '/api/user/enrolled-courses',
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
              const enrolledCourses = response.data.enrolledCourses;
              const isEnrolled = enrolledCourses.some(course => course._id === id);

              if (isEnrolled) {
                toast.success('Successfully enrolled in the course!');
                window.location.href = '/my-enrollments';
                return;
              }
            }

            if (retryCount < maxRetries) {
              retryCount++;
              toast.info(`Checking enrollment status... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              await checkEnrollment();
            } else {
              toast.warn('Enrollment status check timed out. Please check My Enrollments page.');
              window.location.href = '/my-enrollments';
            }
          } catch (error) {
            console.error('Error checking enrollment:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 2000));
              await checkEnrollment();
            } else {
              toast.error('Error verifying enrollment. Please check My Enrollments page.');
              window.location.href = '/my-enrollments';
            }
          }
        };

        await checkEnrollment();
      } else if (paymentCancelled === 'true') {
        toast.info('Payment was cancelled');
      }
    };

    fetchCourseData();
    handlePaymentStatus();
  }, [])

  useEffect(() => {
    if (userData && courseData) {
      setIsAlreadyEnrolled(userData.enrolledCourses.includes(courseData._id))
    }
  }, [userData, courseData])

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  if (!courseData || loadingEnroll) return <Loading />

  return (
    <>
      <div className='flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-30 pt-20 text-left'>
        <div className='absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-100/70'></div>

        {/* Left Column */}
        <div className='max-w-xl z-10 text-gray-500'>
          <h1 className='text-4xl font-semibold text-gray-800'>{courseData.courseTitle}</h1>
          <div className='pt-4'>
            <p className='md:text-base text-sm' dangerouslySetInnerHTML={{ 
              __html: courseData.courseDescription.length > 300 
                ? courseData.courseDescription.slice(0, 300) + '... ' 
                : courseData.courseDescription 
            }}></p>
            {courseData.courseDescription.length > 300 && (
              <button 
                onClick={() => document.getElementById('fullDescription').scrollIntoView({ behavior: 'smooth' })} 
                className='text-blue-600 hover:text-blue-700 text-sm mt-2'
              >
                Show more
              </button>
            )}
          </div>

          {/* Rating */}
          <div className='flex items-center space-x-2 pt-3 pb-1 text-sm'>
            <p>{calculateRating(courseData)}</p>
            <div className='flex'>
              {[...Array(5)].map((_, i) => (
                <img key={i} src={i < Math.floor(calculateRating(courseData)) ? assets.star : assets.star_blank} alt='' className='w-3.5 h-3.5' />
              ))}
            </div>
            <p className='text-blue-600'>({courseData.courseRatings.length} {courseData.courseRatings.length > 1 ? 'ratings' : 'rating'})</p>
            <p>{courseData.enrolledStudents.length}{courseData.enrolledStudents.length > 1 ? ' students' : ' student'}</p>
          </div>

          <p className='text-sm'>Course by <span className='text-blue-600 underline'>{courseData.educator.name}</span></p>
          <p className='text-sm mt-2'>Total Duration: {calculateCourseDuration(courseData)}</p>

          {/* Course Structure */}
          <div className='pt-8 text-gray-800'>
            <h2 className='text-xl font-semibold'>Course structure</h2>
            <div className='pt-5'>
              {Array.isArray(courseData.courseContent) && courseData.courseContent.map((chapter, index) => (
                <div key={index} className='border border-gray-300 bg-white mb-2 rounded'>
                  <div
                    className='flex items-center justify-between px-4 py-3 cursor-pointer select-none'
                    onClick={() => toggleSection(index)}
                  >
                    <div className='flex items-center gap-2 pr-3'>
                      <img src={assets.down_arrow_icon} alt="arrow icon" className={`transform transition-transform ${openSections[index] ? 'rotate-180' : ''}`} />
                      <p className='font-medium md:text-base text-sm'>{chapter.chapterTitle}</p>
                    </div>
                    <p className='text-sm md:text-default'>
                      {Array.isArray(chapter.chapterContent) ? chapter.chapterContent.length : 0} lecture{chapter.chapterContent?.length !== 1 ? 's' : ''} • {calculateChapterTime(chapter)}
                    </p>
                  </div>
                  <div className={`${openSections[index] ? 'block' : 'hidden'}`}>
                    <ul className='list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300'>
                      {Array.isArray(chapter.chapterContent) ? chapter.chapterContent.map((lecture, i) => (
                        <li key={i} className='flex items-start gap-2 py-1'>
                          <img src={assets.play_icon} alt="play icon" className='w-4 h-4 mt-0.75' />
                          <div className='flex items-center justify-between w-full text-gray-800 text-sm md:text-default'>
                            <p>{lecture.lectureTitle}</p>
                            <div className='flex gap-2 items-center'>
                              <span className='text-gray-500'>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['h', 'm'], round: true })}</span>
                              {lecture.isPreviewFree && (
                                <p
                                  onClick={() => setPlayerData({ videoId: lecture.lectureUrl.split('/').pop() })}
                                  className='text-blue-500 cursor-pointer'
                                >
                                  Preview
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      )) : <p className='text-gray-500 italic px-4'>No lectures in this chapter</p>}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Description */}
          <div id='fullDescription' className='py-20 text-sm md:text-default'>
            <h3 className='text-xl font-semibold text-gray-800'>Course Description</h3>
            <div className='mt-4 space-y-4 rich-text'>
              <p className='leading-relaxed' dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}></p>
              <div className='pt-6 space-y-4'>
                <h4 className='font-medium text-gray-800'>What you'll learn:</h4>
                <ul className='list-disc pl-5 space-y-2'>
                  {courseData.courseDescription.split('\n').filter(line => line.trim().startsWith('•')).map((point, index) => (
                    <li key={index} className='text-gray-600'>{point.replace('•', '').trim()}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className='max-w-[424px] z-10 shadow-[0px_4px_15px_2px_rgba(0,0,0,0.1)] rounded-t md:rounded-none overflow-hidden bg-white min-w-[300px] sm:min-w-[420px] '>
          {playerData
            ? <YouTube videoId={playerData.videoId} opts={{ playerVars: { autoplay: 1 } }} iframeClassName='w-full aspect-video' />
            : <img src={courseData.courseThumbnail} alt="Thumbnail" />
          }

          <div className='p-5'>
            <div className='flex items-center gap-2'>
              <img className='w-3.5' src={assets.time_left_clock_icon} alt="time left clock icon" />
              <p className='text-red-500'><span className='font-medium'>5 Days</span> left at this price!</p>
            </div>
            <div className='flex gap-3 items-center pt-2'>
              <p className='text-gray-800 md:text-4xl text-2xl font-semibold'>{currency} {(courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2)}</p>
              <p className='md:text-lg text-gray-500 line-through'>{currency} {courseData.coursePrice}</p>
              <p className='md:text-lg text-gray-500'>{courseData.discount}% off</p>
            </div>

            <div className='flex items-center text-sm md:text-default gap-4 pt-2 md:pt-4 text-gray-500'>
              <div className='flex items-center gap-1'>
                <img src={assets.star} alt="start icon" />
                <p>{calculateRating(courseData)}</p>
              </div>
              <div className='h-4 w-px bg-gray-500/40'></div>
              <div className='flex items-center gap-1'>
                <img src={assets.time_clock_icon} alt="clock icon" />
                <p>{calculateCourseDuration(courseData)}</p>
              </div>
              <div className='h-4 w-px bg-gray-500/40'></div>
              <div className='flex items-center gap-1'>
                <img src={assets.lesson_icon} alt="lesson icon" />
                <p>{calculateNoOfLectures(courseData)} lessons</p>
              </div>
            </div>

            <button onClick={enrollCourse} className='md:mt-6 mt-4 w-full py-3 rounded bg-blue-600 text-white font-medium cursor-pointer'>
              {isAlreadyEnrolled ? 'Already Enrolled' : 'Enroll Now'}
            </button>

            <div className='pt-6'>
              <p className='md:text-xl text-lg font-medium text-gray-800'>What's in the course?</p>
              <ul className='ml-4 pt-2 text-sm md:text-default list-disc text-gray-500'>
                <li>Lifetime access with free updates.</li>
                <li>Step-by-step, hands-on project guidance.</li>
                <li>Downloadable resources and source code.</li>
                <li>Quizzes to test your knowledge.</li>
                <li>Certificate of completion.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}

export default CourseDetails