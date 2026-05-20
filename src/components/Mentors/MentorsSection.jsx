"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const MentorsSection = () => {
  const [mentors, setMentor] = useState([]);
  useEffect(() => {
    fetch("/Data/Mentors.json")
      .then((res) => res.json())
      .then((data) =>  setMentor(data));
  }, []);

  return (
    <div>
      <div className="w-full mt-10">
        <div className="mx-auto flex flex-wrap container justify-between gap-y-4 px-4">
          {mentors.map((mentor, index) => (
            <div key={index}>
              <div className="max-w-3xl mx-auto lg:h-84  ">
                <div className="bg-[#E1FCF9] cursor-pointer hover:shadow-2xl 2xl:w-[740px] container transition-shadow duration-300 border border-gray-200 rounded-md overflow-hidden p-6">
                  <Link href={`/mentors/${mentor.id}`}>
                    <div className="flex flex-col md:flex-row md:items-center  gap-6">
                      <div className="w-full h-full lg:w-5/12 lg:h-72 rounded-md  shadow-md">
                        <Image
                          src={mentor?.image}
                          alt={mentor?.name}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-7/12">
                        <h2 className="text-3xl font-bold text-gray-800 outfit">
                          {mentor.name}
                        </h2>
                        <p className="csd work">
                          {mentor?.designation}{" "}
                          {mentor?.subject && `• ${mentor.subject}`}
                        </p>
                        <p className="text-sm text-gray-500 mt-2 work">
                          ✅ {mentor?.training_experience?.years} Years of
                          Training Experience
                        </p>

                        <div>
                          <h3 className="text-xl outfit mt-5 font-bold text-gray-800 mb-3 flex items-center">
                            <span className="w-3 h-3 bg-[#F79952] rounded-full mr-2"></span>
                            Work Experience
                          </h3>
                          <ul className="space-y-1 work">
                            {mentor.work_experience
                              ?.slice(0, 3)
                              .map((work, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start text-[15px]"
                                >
                                  <svg
                                    className="h-5 w-5 cpr mr-2 mt-0.5 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span className="crd">{work}</span>
                                </li>
                              ))}
                          </ul>
                        </div>

                        {/* <button className="mt-4 bg-[#00C6AD] text-white px-4 py-2 rounded hover:bg-[#009f8a] transition cursor-pointer">
                          View Profile
                        </button> */}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MentorsSection;
