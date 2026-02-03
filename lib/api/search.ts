// Search API Types
export interface User {
  id: number;
  username: string;
  fullname: string;
  bio?: string;
  mastery_title: string;
  life_level: number;
  master_level?: number;
  totalxp: number;
  primary_color: string;
  secondary_color: string;
  follower_count?: number;
  post_count?: number;
  streak_count?: number;
  is_following?: boolean;
  is_current_user?: boolean;
  profile_picture?: string;
}

export interface Post {
  id: number;
  uid: string;
  title: string;
  content: string;
  post_image?: string;
  created_at: string;
  updated_at: string;
  duration?: string;
  tags?: string;
  xp_distribution?: Record<string, number>;
  user: {
    username: string;
    fullname: string;
    mastery_title: string;
    life_level: number;
    primary_color: string;
    secondary_color: string;
  };
  like_count: number;
  comment_count: number;
}

export interface Activity {
  id: number;
  name: string;
  description?: string;
  activity_type: "physique" | "creativity" | "social" | "energy" | "logic";
  emoji: string;
  total_xp: number;
  xp_distribution?: Record<string, number>;
  created_by?: {
    username: string;
    fullname: string;
    mastery_title: string;
  };
  created_at: string;
  used_count: number;
  reasoning?: string;
}

export interface SearchResults {
  query: string;
  results: {
    posts: Post[];
    users: User[];
    activities: Activity[];
  };
  counts: {
    posts: number;
    users: number;
    activities: number;
  };
}

export interface PostsSearchResult {
  query: string;
  posts: Post[];
  pagination: Pagination;
}

export interface UsersSearchResult {
  query: string;
  users: User[];
  pagination: Pagination;
}

export interface ActivitiesSearchResult {
  query: string;
  activity_type?: string;
  activities: Activity[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  has_more: boolean;
}

export interface SearchHistoryItem {
  id: number;
  search_query: string;
  search_type: "global" | "posts" | "users" | "activities";
  searched_at: string;
}

export interface SearchHistoryResponse {
  search_history: SearchHistoryItem[];
  count: number;
  filter_type?: string;
}

// Search API Functions

/**
 * Global search across posts, users, and activities
 */
export async function globalSearch(query: string, limit: number = 10): Promise<SearchResults> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.detail || "Search failed");
  }

  return response.json();
}

/**
 * Search posts only
 */
export async function searchPosts(
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<PostsSearchResult> {
  const response = await fetch(
    `/api/search/posts?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.detail || "Search failed");
  }

  return response.json();
}

/**
 * Search users only
 */
export async function searchUsers(
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<UsersSearchResult> {
  const response = await fetch(
    `/api/search/users?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.detail || "Search failed");
  }

  return response.json();
}

/**
 * Search activities only
 */
export async function searchActivities(
  query: string,
  type?: string,
  page: number = 1,
  limit: number = 20
): Promise<ActivitiesSearchResult> {
  let url = `/api/search/activities?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
  if (type) {
    url += `&type=${type}`;
  }

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.detail || "Search failed");
  }

  return response.json();
}

/**
 * Save search to history
 */
export async function saveSearchHistory(
  searchQuery: string,
  searchType: "global" | "posts" | "users" | "activities"
): Promise<{ success: boolean; search_history: SearchHistoryItem; message: string }> {
  const response = await fetch("/api/search/history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      search_query: searchQuery,
      search_type: searchType,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.detail || "Failed to save search history");
  }

  return response.json();
}

/**
 * Get search history
 */
export async function getSearchHistory(
  limit: number = 20,
  type?: string
): Promise<SearchHistoryResponse> {
  let url = `/api/search/history?limit=${limit}`;
  if (type) {
    url += `&type=${type}`;
  }

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.detail || "Failed to fetch search history");
  }

  return response.json();
}

/**
 * Delete a specific search history item
 */
export async function deleteSearchHistoryItem(id: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/search/history/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.detail || "Failed to delete search history item");
  }

  return response.json();
}

/**
 * Clear all search history
 */
export async function clearSearchHistory(type?: string): Promise<{ success: boolean; message: string; deleted_count: number }> {
  let url = "/api/search/history/clear";
  if (type) {
    url += `?type=${type}`;
  }

  const response = await fetch(url, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.detail || "Failed to clear search history");
  }

  return response.json();
}
