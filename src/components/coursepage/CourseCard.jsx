"use client";

import Link from "next/link";
import { BiCategory } from "react-icons/bi";
import { FaWhatsapp } from "react-icons/fa";
import { LuBookOpenCheck } from "react-icons/lu";

const CourseCard = ({ course }) => {
  const { id, title, category, type, image, fee, rating } = course;

  return (
    <div className="relative bg-transparent cursor-pointer transition-transform duration-700 ease-in-out hover:scale-[1.03] hover:shadow-xl group perspective rounded-xl">
      <div className="rounded-md border border-gray-200 bg-white p-2 text-gray-800 overflow-hidden transition-all duration-700 ease-in-out">
        
        {/* Thumbnail */}
        <Link href={`/${id}`}>
          <div className="relative h-52 w-full overflow-hidden rounded-xl">
            <img
              src={image}
              alt={title}
              className="h-full w-full rounded-xl object-cover transform transition-transform duration-700 ease-in-out group-hover:scale-105"
            />
          </div>
        </Link>

        {/* Course Info */}
        <div className="mt-5 space-y-1 text-left pl-4">
          <div className="flex justify-between pr-8">
            <div className="flex items-center gap-1">
              <BiCategory />
              <p className="text-[13px] work">{category}</p>
            </div>
            <p className="bg-[#F79952] text-white text-[13px] px-2 py-1 work rounded-[4px]">
              {type}
            </p>
          </div>

          <Link href={`/${id}`}>
            <h2 className="text-[22px] font-bold w-10/12 h-17 outfit-semibold csd line-clamp-2">
              {title}
            </h2>
          </Link>

          <div className="flex justify-between pr-8 items-center">
            <p className="text-lg font-semibold text-gray-800 work">
              Course Fee: {fee}
            </p>
            <div className="rating text-sm flex gap-1">
              {[...Array(5)].map((_, i) => (
                <input
                  key={i}
                  type="radio"
                  name={`rating-${id}`}
                  className="mask mask-star-2 bg-orange-400 w-5"
                  aria-label={`${i + 1} star`}
                  defaultChecked={i + 1 === rating}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
 
         <div className="flex justify-between gap-2 items-center mt-2 mb-2">
          <Link
            href={`/${id}`}
            className="flex gap-2 text-xl items-center border bg-[#41bfb8] border-[#41bfb8] px-4 ml-2 py-2 rounded-md"
          >
            <LuBookOpenCheck className="text-md font-semibold text-white" />
            <p className="work tracking-tight text-[15px] text-white">
                Details
            </p>
          </Link>

          <Link
            href={`https://wa.me/8801321231802?text=${encodeURIComponent(
              `আমি "${title}" কোর্সটি করতে চাই।`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex gap-1 text-xl items-center border border-[#41bfb8] px-4 py-2 mr-6 rounded-md hover:bg-[#e0f7f5] cursor-pointer transition">
              <FaWhatsapp className="text-xl text-[#41bfb8] font-medium" />
              <p className="text-[#41bfb8] work text-[15px] tracking-tight">
                Get Course
              </p>
            </div>
          </Link>
        </div>
      
      </div>
    </div>
  );
};

export default CourseCard;
