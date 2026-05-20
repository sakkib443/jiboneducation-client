import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCategories, setSelectedCategories } from "@/redux/categorySlice";
import { IoSearchSharp } from "react-icons/io5";
import { useSearchParams } from "next/navigation";

const LeftCategory = ({ searchQuery, setSearchQuery }) => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const { items: courseCategories, status, error, selectedCategories } = useSelector(
    (state) => state.categories
  );

  useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

  // Handle URL category parameter
  useEffect(() => {
    const urlCategory = searchParams.get("category");
    if (urlCategory) {
      // If category comes from URL and it's not already selected, select it
      if (!selectedCategories.includes(urlCategory)) {
        dispatch(setSelectedCategories([urlCategory]));
      }
    }
  }, [searchParams, dispatch]);

  const handleCheckboxChange = (categoryName) => {
    const newSelection = selectedCategories.includes(categoryName)
      ? selectedCategories.filter((item) => item !== categoryName)
      : [...selectedCategories, categoryName];
    dispatch(setSelectedCategories(newSelection));
  };

  const filteredCategories = courseCategories.filter((category) => category.name !== "All"); // show full category list (do not filter by search)


  return (
    <div className="w-full">
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search categories"
          value={searchQuery || ""}
          onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          className="w-full pl-4 pr-10 py-3 text-base crd placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F79952] focus:border-transparent transition-all duration-200"
        />
        <IoSearchSharp className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl cursor-pointer hover:text-[#F79952] transition-colors duration-200" />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 bg-gray-50 px-6 py-4 border-b border-gray-200">
          Categories
        </h3>

        <div className="flex flex-col gap-2 p-4">
          {/* All Option */}
          <label
            className={`flex items-center gap-3 cursor-pointer ${
              selectedCategories.length === 0 ? "text-[#F79952] font-medium" : "crd hover:text-[#F79952]"
            }`}
            onClick={() => dispatch(setSelectedCategories([]))}
          >
            <input type="checkbox" className="checkbox w-5 h-5 rounded-sm" checked={selectedCategories.length === 0} readOnly />
            <span className="text-base md:text-lg">All</span>
          </label>

          {status === "loading" && <p>Loading...</p>}
          {status === "failed" && <p>{error}</p>}
          {status === "succeeded" &&
            filteredCategories.map((category) => (
              <label
                key={category.id}
                className={`flex items-center gap-3 cursor-pointer ${
                  selectedCategories.includes(category.name)
                    ? "text-[#F79952] font-medium"
                    : "crd hover:text-[#F79952]"
                }`}
                onClick={() => handleCheckboxChange(category.name)}
              >
                <input type="checkbox" className="checkbox w-5 h-5 rounded-sm" checked={selectedCategories.includes(category.name)} readOnly />
                <span className="text-base md:text-lg">{category.name}</span>
              </label>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LeftCategory;
