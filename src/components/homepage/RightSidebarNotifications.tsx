"use client";

import Link from "next/link";

type Notification = {
  id: string;
  image: string;
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
        <div className="flex justify-between items-center mb-4">
          <p className="text-md  font-semibold dark:text-white">Notifications</p>
          {unreadCount > 0 && (
            <span className="h-5 w-5 bg-red-600 text-white text-xs font-bold flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          <ul className="flex flex-col gap-3">
            {notifications.map((n) => (
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
                      <p dangerouslySetInnerHTML={{ __html: n.text }} />
                      <p className="text-gray-500 text-xs">{n.date}</p>
                    </div>
                  </div>
                </li>
              </Link>
            ))}
          </ul>
        </div>
      </div>

    
    </>
  );
}
