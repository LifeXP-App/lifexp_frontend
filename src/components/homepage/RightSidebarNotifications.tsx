"use client";

import Link from "next/link";

type Notification = {
  id: string;
  image: string;
  sender: string;
  text: string;
  date: string;
  href: string;
  rounded?: boolean;
};

type SuggestedUser = {
  username: string;
  fullname: string;
  profile_picture: string;
  lifelevel: number;
};

type RightSidebarNotificationsProps = {
  notifications: Notification[];
  unreadCount: number;

};

export function RightSidebarNotifications({
  notifications,
  unreadCount,

}: RightSidebarNotificationsProps) {
  return (
    <>
      {/* NOTIFICATIONS */}
      <div className="bg-white w-full p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900">
        <div className="flex justify-between items-center mb-6">
          <p className="text-md  font-semibold dark:text-white">Notifications</p>
          {unreadCount > 0 && (
            <span className="h-5 w-5 bg-red-600 text-white text-xs font-bold flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          <ul className="flex flex-col gap-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-2 text-gray-400 dark:text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-10 h-10 mb-2 opacity-70"
                >
                  <path d="M12 2a6 6 0 0 0-6 6v3.6l-1.8 3.6A1 1 0 0 0 5 17h14a1 1 0 0 0 .8-1.8L18 11.6V8a6 6 0 0 0-6-6zm0 20a3 3 0 0 0 2.83-2H9.17A3 3 0 0 0 12 22z"/>
                </svg>

                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs opacity-70">You're all caught up</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link key={n.id} href={n.href}>
                  <li>
                    <div className="flex gap-4">
                      <img
                        src={n.image}
                        className={`h-12 w-12 object-cover ${
                          n.rounded ? "rounded-full" : "rounded-md"
                        }`}
                        loading="lazy"
                      />
                      <div className="flex flex-col">
                        <p className="text-md font-medium text-gray-900 dark:text-white">
                          <span className="font-bold">{n.sender}</span>{" "}
                          <span className="font-medium">{n.text}</span>
                        </p>
                        <p className="text-gray-500 text-xs">{n.date}</p>
                      </div>
                    </div>
                  </li>
                </Link>
              ))
            )}
          </ul>
        </div>
      </div>

    
    </>
  );
}
