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

export function VideoListItem({ video, onEdit, onDelete, handleLike }) {
  const router = useRouter();
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && video.likes?.includes(user.id)) {
      setIsLiked(true);
    }
  }, [video, user]);

  const handleLikeClick = () => {
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
      className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
      onClick={() =>
        router.push(`/${video.category.toLowerCase()}-videos/${video._id}`)
      }
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="relative w-48 h-27 flex-shrink-0">
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
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
              <BsPlayFill className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
            {video.platform}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">
            {video.title}
          </h3>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
            <div className="flex items-center gap-1">
              <BsEye className="text-blue-500" />
              <span>{formatViews(video.views)} views</span>
            </div>
            <div className="flex items-center gap-1">
              <BsHeart className="text-red-500" />
              <span>{video.likes?.length || 0} likes</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">
              {video.recordingDate &&
                formatDistanceToNow(new Date(video.recordingDate), {
                  addSuffix: true,
                })}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {video.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleLikeClick}
            disabled={isLoading}
            className={`p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg transition-all ${
              isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
            }`}
          >
            {isLiked ? (
              <BsHeartFill className="text-red-500" size={20} />
            ) : (
              <BsHeart className="text-red-500" size={20} />
            )}
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <BsThreeDotsVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10">
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
        </div>
      </div>
    </div>
  );
}
