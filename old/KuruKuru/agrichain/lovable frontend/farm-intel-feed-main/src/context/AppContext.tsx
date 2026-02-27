import React, { createContext, useContext, useState, useCallback } from "react";
import type { SocialPost, FarmerProfile, UserSummary } from "@/services/api";
import * as api from "@/services/api";

interface AppState {
  posts: SocialPost[];
  profile: FarmerProfile | null;
  postsLoading: boolean;
  profileLoading: boolean;
  followingMap: Record<string, boolean>;
  fetchPosts: () => Promise<void>;
  addPost: (content: string, imageUrl?: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  reportPost: (postId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  getFollowers: (userId: string) => Promise<UserSummary[]>;
  getFollowing: (userId: string) => Promise<UserSummary[]>;
  fetchProfile: () => Promise<void>;
  updateProfile: (profile: FarmerProfile) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const data = await api.getSocialPosts();
      setPosts(data);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const addPost = useCallback(async (content: string, imageUrl?: string) => {
    const newPost = await api.createPost(content, imageUrl);
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const toggleLike = useCallback(async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked } : p))
    );
    await api.likePost(postId);
  }, []);

  const reportPostAction = useCallback(async (postId: string) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reported: true } : p)));
    await api.reportPost(postId);
  }, []);

  const toggleFollow = useCallback(async (userId: string) => {
    // Optimistic UI update
    const wasFollowing = followingMap[userId] || false;
    setFollowingMap((prev) => ({ ...prev, [userId]: !wasFollowing }));
    try {
      if (wasFollowing) {
        await api.unfollowUser(userId);
      } else {
        await api.followUser(userId);
      }
    } catch {
      // Revert on error
      setFollowingMap((prev) => ({ ...prev, [userId]: wasFollowing }));
    }
  }, [followingMap]);

  const getFollowersAction = useCallback(async (userId: string) => {
    return api.getFollowers(userId);
  }, []);

  const getFollowingAction = useCallback(async (userId: string) => {
    return api.getFollowing(userId);
  }, []);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await api.getProfile();
      setProfile(data);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (p: FarmerProfile) => {
    setProfileLoading(true);
    try {
      const saved = await api.saveProfile(p);
      setProfile(saved);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        posts,
        profile,
        postsLoading,
        profileLoading,
        followingMap,
        fetchPosts,
        addPost,
        toggleLike,
        reportPost: reportPostAction,
        toggleFollow,
        getFollowers: getFollowersAction,
        getFollowing: getFollowingAction,
        fetchProfile,
        updateProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
