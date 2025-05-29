import React, { useState, useEffect } from "react";
import { assets } from "../../assets/assets";
import { useNavigate } from "react-router-dom";

const SearchBar = ({ data, resetSearch }) => {
  const navigate = useNavigate();
  const [input, setInput] = useState(data || "");

  useEffect(() => {
    setInput(data || "");
  }, [data]);

  const onSearchHandler = (e) => {
    e.preventDefault();
    if (input.trim() !== "") {
      navigate(`/course-list/${input}`);
    }
  };

  return (
    <form
      onSubmit={onSearchHandler}
      className="max-w-xl w-full md:h-14 h-12 flex items-center bg-white border border-teal-600 rounded"
    >
      <img src={assets.search_icon} alt="search_icon" className="md:w-auto w-10 px-3" />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search for courses"
        className="w-full h-full outline-none text-gray-500/80"
      />
      <button type="submit" className="bg-teal-600 rounded text-white md:px-10 px-7 py-2 mx-1">
        Search
      </button>
    </form>
  );
};

export default SearchBar;