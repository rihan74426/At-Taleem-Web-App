"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BsThreeDotsVertical,
  BsEye,
  BsHeart,
  BsHeartFill,
  BsPlayFill,
} from "react-icons/bs";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export function VideoCard({ video, onEdit, onDelete, handleLike }) {
  const router = useRouter();
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && video.likes?.includes(user.id)) {
      setIsLiked(true);
    }
  }, [video, user]);

  const handleLikeClick = async (e) => {
    handleLike(video._id);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(video);
    setShowMenu(false);
  };

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        await onDelete(video._id);
        toast.success("Video deleted successfully");
      } catch (error) {
        toast.error("Failed to delete video");
      }
    }
    setShowMenu(false);
  };

  const formatViews = (views) => {
    if (!views) return "0";
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <div
      className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail Container */}
      <Link
        href={`/${video.category.toLowerCase()}-videos/${video._id}`}
        className=" cursor-pointer"
      >
        <div className="relative aspect-video overflow-hidden">
          <div className="relative w-full h-36">
            <Image
              src={video.thumbnailUrl || "/thumbnail.png"}
              alt={video.title}
              fill
              className="rounded object-cover blur-sm transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.target.src = "/thumbnail.png";
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <div className="bg-green-800 bg-opacity-80 text-white text-center px-2 py-1 rounded-lg">
                {video.title}
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Platform Badge */}
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
            {video.platform}
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <BsPlayFill className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <Link
        href={`/${video.category.toLowerCase()}-videos/${video._id}`}
        className="cursor-pointer"
      >
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">
            {video.title}
          </h3>

          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <BsEye className="text-blue-500" />
              <span>{formatViews(video.views)} views</span>
            </div>
            <div className="flex items-center gap-2">
              <BsHeart className="text-red-500" />
              <span>{video.likes?.length || 0}</span>
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {video.recordingDate &&
              formatDistanceToNow(new Date(video.recordingDate), {
                addSuffix: true,
              })}
          </div>
        </div>
      </Link>

      {/* Action Menu */}
      <div className="absolute top-2 left-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 bg-black/70 text-white rounded-full hover:bg-black/90 transition-colors"
        >
          <BsThreeDotsVertical size={16} />
        </button>

        {showMenu && (
          <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10">
            <button
              onClick={handleEditClick}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteClick}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Like Button */}
      <button
        onClick={handleLikeClick}
        disabled={isLoading}
        className={`absolute bottom-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg transition-all ${
          isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
        }`}
      >
        {isLiked ? (
          <BsHeartFill className="text-red-500" size={20} />
        ) : (
          <BsHeart className="text-red-500" size={20} />
        )}
      </button>
    </div>
  );
}
