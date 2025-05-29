import React from "react";
import { assets, dummyTestimonial } from "../../assets/assets";

const TestimonialsSection = () => {
  return (
    <div className="pb-14 lg:px-40 md:px-20 px-8 text-center">
      <h2 className="text-3xl font-medium text-gray-800">Testimonials</h2>
      <p className="md:text-base text-gray-500 mt-3 max-w-3xl mx-auto">
        Hear from our learners as they share their journeys of transformation,
        success, and how our platform has made the difference in their lives.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-4 py-16 my-5 mt-0.5 gap-8">
        {dummyTestimonial.map((testimonial, index) => (
          <div key={index} className="text-sm text-left border border-gray-300 pb-6 rounded-lg bg-white shadow-lg shadow-black/10 overflow-hidden"
          >
            <div className="flex items-center px-5 py-4 gap-4 bg-gray-100">
              <img className="h-12 w-12 rounded-full object-cover" src={testimonial.image} alt={testimonial.name} />
              <div>
                <h1 className="text-lg font-medium text-gray-800">{testimonial.name}</h1>
                <p className="text-gray-600">{testimonial.role}</p>
              </div>
            </div>
            <div className="p-5 pb-7">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <img className="h-5" key={i} src={ i < Math.floor(testimonial.rating) ? assets.star : assets.star_blank } alt="star"/>
                ))}
              </div>
              <p className="text-gray-600 mt-5 leading-relaxed ">{testimonial.feedback}</p>
            </div>
            <a href="#" className="text-teal-500 font-medium underline px-5 block">Read more</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsSection;
