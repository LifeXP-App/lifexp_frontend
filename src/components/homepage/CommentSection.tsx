"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

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

export function CommentSection({ postId, comments: initialComments, onClose }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- TIME FORMAT ---------------- */

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

    return createdAtDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* ---------------- LOAD COMMENTS ---------------- */

  useEffect(() => {
    const loadComments = async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/comments`, {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();

        const list = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];

        setComments(
          list.map((c: any) => ({
            id: c.id,
            username: c.user.username,
            fullname: c.user.fullname,
            profile_picture: c.user.profile_picture,
            created_at: c.created_at,
            comment: c.content,
          }))
        );
      } catch (err) {
        console.error("Failed to load comments", err);
      }
    };

    loadComments();
  }, [postId]);

  /* ---------------- POST COMMENT ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: commentText }),
      });

      if (!res.ok) return;

      const c = await res.json();

      // optimistic prepend
      setComments((prev) => [
        {
          id: c.id,
          username: c.user.username,
          fullname: c.user.fullname,
          profile_picture: c.user.profile_picture,
          created_at: c.created_at,
          comment: c.content,
        },
        ...prev,
      ]);

      setCommentText("");
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-dark-3 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold dark:text-white">
              Comments ({comments.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <XMarkIcon className="w-6 h-6 dark:text-white" />
            </button>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-dark-2">
            {comments.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <img
                    src={comment.profile_picture.replace(
                      "/upload/",
                      "/upload/f_auto,q_auto,w_80,c_fill/"
                    )}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm dark:text-white">
                        {comment.fullname}
                      </span>
                      <span className="text-sm text-gray-500 font-bold">
                        @{comment.username}
                      </span>
                      <span className="text-sm text-gray-400">
                        {getTimeAgo(comment.created_at)}
                      </span>
                    </div>

                    <p className="text-base dark:text-gray-200">
                      {comment.comment}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
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
                className="w-full px-4 py-3 pr-12 rounded-lg border dark:bg-dark-3"
              />

              {commentText.trim() && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <PaperAirplaneIcon className="w-5 h-5 text-blue-600" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
