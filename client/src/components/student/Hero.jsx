import React from "react";
import { assets } from "../../assets/assets";
import SearchBar from "./Searchbar";

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full md:pt-36 pt-20 px-6 md:px-0 space-y-6 text-center bg-gradient-to-b from-cyan-100/70">
      <h1 className="relative font-bold text-gray-800 max-w-3xl mx-auto text-2xl md:text-4xl lg:text-5xl leading-tight">
        Empower your future with courses designed to{" "}
        <span className="text-blue-600">fit your choice.</span>
        <img
          src={assets.sketch}
          alt="sketch"
          className="md:block hidden absolute -bottom-6 right-0 w-20 md:w-50"
        />
      </h1>
      <p className="md:block hidden  text-gray-600 max-w-2xl mx-auto text-md">
        We bring together world-class instructors, interactive content, and a
        supportive community to help you achieve your personal and professional
        goals.
      </p>
      <p className="md:hidden text-gray-600 max-w-sm mx-auto text-sm">
        We bring together world-class instructors to help you achieve your goals.
      </p>
      <SearchBar/>
    </div>
  );
};

export default Hero;
