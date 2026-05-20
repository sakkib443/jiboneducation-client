"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
;
 
import { useSearchParams } from "next/navigation";
import { fetchCoursesData } from "../../redux/CourseSlice";
import CourseCard from "../sheard/CourseCard";

const RightCoursesDetalis = ({ searchQuery }) => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  const { courses = [], loading = false } = useSelector((state) => state.courses || {});

  const urlType = searchParams.get("type");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

useEffect(() => {
  dispatch(fetchCoursesData());
}, [dispatch]);


  useEffect(() => {
    if (urlType && ["Online","Offline","Recorded"].includes(urlType)) setSelectedType(urlType);
    else setSelectedType("All");
  }, [urlType]);

  const allMentors = [...new Set(courses.map(c => c?.instructorName).filter(Boolean))];

  const filteredCourses = courses.filter((course) => {
    if (!course) return false;
    const typeMatch = selectedType === "All" || course?.type === selectedType;
    const mentorMatch = !selectedMentor || course?.instructorName === selectedMentor;
    // Category filtering disabled — search alone will control results
    const categoryMatch = true;
    // Search matching: title, instructorName, category
    const q = (searchQuery || "").trim().toLowerCase();
    const searchMatch =
      q === "" ||
      (course.title && course.title.toLowerCase().includes(q)) ||
      (course.instructorName && course.instructorName.toLowerCase().includes(q)) ||
      (course.category && course.category.toLowerCase().includes(q));
    return typeMatch && mentorMatch && categoryMatch && searchMatch;
  });

  const handleTypeChange = (type) => { setSelectedType(type); setSelectedMentor(null); };
  const handleMentorSelect = (mentor) => { setSelectedMentor(mentor === selectedMentor ? null : mentor); setIsDropdownOpen(false); };

  const typeButtons = ["All","Online","Offline","Recorded"];

  return (
    <div className="flex flex-col gap-7">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <h1 className="text-[#F79952] text-4xl md:text-5xl outfit-semibold">
          Our <span className="crd">Courses</span>
        </h1>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-4">
            {typeButtons.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`py-2 px-4 cursor-pointer rounded-md transition-colors ${
                  selectedType === type
                    ? "bg-[#41bfb8] text-white font-medium"
                    : "text-black border border-gray-300"
                }`}
              >
                <p className="text-sm md:text-base">{type}</p>
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`py-3 px-4 cursor-pointer rounded-md shadow-md transition-colors text-white ${
                selectedMentor
                  ? "bg-[#41bfb8] font-medium"
                  : "bg-[#F79952] hover:bg-[#F79952]/85"
              }`}
            >
              <p className="text-sm md:text-base">{selectedMentor || "Select Mentor 🖌️"}</p>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {allMentors.length > 0 ? (
                  allMentors.map((mentor) => (
                    <div
                      key={mentor}
                      onClick={() => handleMentorSelect(mentor)}
                      className={`px-4 py-2 text-base cursor-pointer ${
                        selectedMentor === mentor
                          ? "bg-[#41bfb8] text-white"
                          : "hover:bg-gray-100 text-black"
                      }`}
                    >
                      {mentor}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">No mentors available</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <p>Loading courses...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => <CourseCard key={course?.id} course={course} />)
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-lg text-gray-600">No courses found matching your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RightCoursesDetalis;
