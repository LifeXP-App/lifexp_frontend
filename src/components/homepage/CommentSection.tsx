"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

type Comment = {
  id: number;
  username: string;
  fullname: string;
  profile_picture: string;
  created_at: string;
  comment: string;
};

type CommentSectionProps = {
  postId: number;
  comments: Comment[];
  onClose: () => void;
};

export function CommentSection({ postId, comments, onClose }: CommentSectionProps) {
  const [commentText, setCommentText] = useState("");

  const getTimeAgo = (createdAt: string | Date): string => {
    const now = new Date();
    const createdAtDate = new Date(createdAt);
    const diffInMs = now.getTime() - createdAtDate.getTime();
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    
    if (diffInMs < 60000) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    return createdAtDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      console.log("Submit comment:", commentText);
      // TODO: Add API call to submit comment
      setCommentText("");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white dark:bg-dark-3 border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold dark:text-white">
              Comments ({comments.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-black cursor-pointer dark:text-white" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-dark-2">
            {comments.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div className="flex gap-3">
                  <img
                    src={comment.profile_picture.replace(
                      "/upload/",
                      "/upload/f_auto,q_auto,w_80,c_fill/"
                    )}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    alt={comment.fullname}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 ">
                      <span className="font-semibold text-sm  dark:text-white">
                        {comment.fullname}
                      </span>
                      <span className="text-sm text-gray-500 font-bold dark:text-gray-400">
                        @{comment.username}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {getTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-base">
                      {comment.comment}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
         <form 
            onSubmit={handleSubmit}
            className="p-6 border-t border-gray-200 dark:border-gray-700 dark:bg-dark-3"
            >
            <div className="relative">
                <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                
                {commentText.trim() && (
                <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                    <PaperAirplaneIcon 
                    className="w-5 h-5"
                    style={{ color: 'var(--rookie-primary)' }}
                    />
                </button>
                )}
            </div>
            </form>
        </div>
      </div>
    </>
  );
}