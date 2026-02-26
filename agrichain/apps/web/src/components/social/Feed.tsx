import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Post from "./Post";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ImagePlus, Send, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

const Feed: React.FC = () => {
  const { posts, postsLoading, fetchPosts, addPost, toggleLike, reportPost, toggleFollow, followingMap } = useAppContext();
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImage, setShowImage] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    await addPost(content.trim(), imageUrl.trim() || undefined);
    setContent("");
    setImageUrl("");
    setShowImage(false);
    setShowCompose(false);
    setPosting(false);
  };

  return (
    <div className="space-y-4">
      {/* Compose area */}
      {showCompose ? (
        <div className="rounded-xl border bg-card p-4 space-y-3 animate-in slide-in-from-top-2">
          <Textarea
            placeholder={t("social.placeholder")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-none"
            rows={3}
          />
          {showImage && (
            <Input
              placeholder={t("social.imageUrl")}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          )}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setShowImage(!showImage)}>
              <ImagePlus className="h-4 w-4 mr-1" /> {t("social.image")}
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCompose(false)}>
                {t("common.cancel")}
              </Button>
              <Button size="sm" onClick={handlePost} disabled={!content.trim() || posting}>
                <Send className="h-4 w-4 mr-1" /> {t("social.post")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Feed */}
      {postsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onLike={toggleLike}
              onReport={reportPost}
              onFollow={toggleFollow}
              isFollowing={followingMap[post.authorId] || false}
            />
          ))}
        </div>
      )}

      {/* FAB for new post */}
      {!showCompose && (
        <button
          onClick={() => setShowCompose(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          aria-label={t("social.newPost")}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default Feed;
