import React from "react";
import { Heart, MessageCircle, Share2, Flag, BadgeCheck, UserPlus, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialPost } from "@/services/api";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface PostProps {
  post: SocialPost;
  onLike: (id: string) => void;
  onReport: (id: string) => void;
  onFollow: (userId: string) => void;
  isFollowing?: boolean;
}

const Post: React.FC<PostProps> = ({ post, onLike, onReport, onFollow, isFollowing }) => {
  const { t } = useTranslation();
  // ML_INTEGRATION_SENTIMENT: Sentiment analysis badge
  // ML_INTEGRATION_FAKE_NEWS: Fake news flag
  // ML_INTEGRATION_TRENDING: Trending topic tag

  const handleShare = () => {
    navigator.clipboard.writeText(post.content.slice(0, 100));
    toast.success("Copied to clipboard");
  };

  const handleReport = () => {
    onReport(post.id);
    toast.success(t("social.reportSuccess"));
  };

  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <img
          src={post.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author.charAt(0)}`}
          alt={post.author}
          className="h-10 w-10 rounded-full bg-muted object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate">{post.author}</p>
            {post.verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {post.region && <span className="rounded-full bg-muted px-2 py-0.5">{post.region}</span>}
            <span>{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</span>
          </div>
        </div>
        {post.authorId !== "me" && (
          <button
            onClick={() => onFollow(post.authorId)}
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              isFollowing
                ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
            {isFollowing ? t("social.following") : t("social.follow")}
          </button>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed">{post.content}</p>
      {post.imageUrl && (
        <img src={post.imageUrl} alt="Post" className="mt-3 w-full rounded-lg object-cover max-h-52" />
      )}

      <div className="mt-3 flex items-center gap-1 border-t pt-3">
        <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
          <Heart className={cn("h-4 w-4", post.liked && "fill-primary text-primary")} />
          {post.likes}
        </button>
        <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          {post.comments}
        </span>
        <button onClick={handleShare} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
          <Share2 className="h-4 w-4" />
        </button>
        <button
          onClick={handleReport}
          disabled={post.reported}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors",
            post.reported && "opacity-50 cursor-not-allowed"
          )}
        >
          <Flag className={cn("h-4 w-4", post.reported && "fill-destructive text-destructive")} />
        </button>
      </div>
    </article>
  );
};

export default Post;
