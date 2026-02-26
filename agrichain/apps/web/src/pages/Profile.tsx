import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import ProfileForm from "@/components/profile/ProfileForm";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, MapPin, Users, UserCheck, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { UserSummary } from "@/services/api";

type ProfileTab = "posts" | "about" | "network";

const Profile = () => {
  const { profile, profileLoading, fetchProfile, toggleFollow, followingMap } = useAppContext();
  const { t } = useTranslation();
  const [tab, setTab] = useState<ProfileTab>("about");
  const [editing, setEditing] = useState(false);
  const [followers, setFollowers] = useState<UserSummary[]>([]);
  const [following, setFollowing] = useState<UserSummary[]>([]);
  const { getFollowers, getFollowing } = useAppContext();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (tab === "network" && profile) {
      getFollowers(profile.id).then(setFollowers);
      getFollowing(profile.id).then(setFollowing);
    }
  }, [tab, profile, getFollowers, getFollowing]);

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: "posts", label: t("profile.posts") },
    { key: "about", label: t("profile.about") },
    { key: "network", label: t("profile.network") },
  ];

  if (profileLoading && !profile) {
    return (
      <main className="container max-w-lg py-6 pb-24 md:pb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="container max-w-lg py-6 pb-24 md:pb-6">
      {profile && (
        <>
          {/* Profile header */}
          <div className="flex items-start gap-4 mb-4">
            <img
              src={profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name.charAt(0)}`}
              alt={profile.name}
              className="h-20 w-20 rounded-full bg-muted object-cover border-2 border-primary/20"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold truncate">{profile.name}</h1>
                <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
              </div>
              {profile.region && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="h-3.5 w-3.5" /> {profile.region}
                </p>
              )}
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-around rounded-xl border bg-card p-3 mb-4">
            <div className="text-center">
              <p className="text-lg font-bold">{profile.postsCount}</p>
              <p className="text-xs text-muted-foreground">{t("profile.postsCount")}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{profile.followersCount}</p>
              <p className="text-xs text-muted-foreground">{t("profile.followersCount")}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{profile.followingCount}</p>
              <p className="text-xs text-muted-foreground">{t("profile.followingCount")}</p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex rounded-lg border bg-card p-1 mb-4">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setEditing(false); }}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "about" && (
            editing ? (
              <ProfileForm />
            ) : (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{t("profile.about")}</h2>
                  <button onClick={() => setEditing(true)} className="text-xs font-medium text-primary hover:underline">
                    {t("profile.editProfile")}
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("profile.regionLabel")}</span>
                    <span className="font-medium">{profile.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("profile.cropSpecialization")}</span>
                    <span className="font-medium">{profile.cropPreferences.join(", ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("profile.storageType")}</span>
                    <span className="font-medium">{profile.storageType}</span>
                  </div>
                </div>
              </div>
            )
          )}

          {tab === "posts" && (
            <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {t("profile.noPostsYet")}
            </div>
          )}

          {tab === "network" && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {t("profile.followersCount")} ({followers.length})
                </h3>
                <ul className="space-y-2">
                  {followers.map((u) => (
                    <li key={u.id} className="flex items-center gap-3">
                      <img src={u.avatarUrl} alt={u.name} className="h-8 w-8 rounded-full bg-muted" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.region}</p>
                      </div>
                      <button
                        onClick={() => toggleFollow(u.id)}
                        className={cn(
                          "text-xs font-medium rounded-full px-3 py-1 transition-colors",
                          (followingMap[u.id] || u.isFollowing)
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {(followingMap[u.id] || u.isFollowing) ? t("social.following") : t("social.follow")}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4" /> {t("profile.followingCount")} ({following.length})
                </h3>
                <ul className="space-y-2">
                  {following.map((u) => (
                    <li key={u.id} className="flex items-center gap-3">
                      <img src={u.avatarUrl} alt={u.name} className="h-8 w-8 rounded-full bg-muted" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.region}</p>
                      </div>
                      <button
                        onClick={() => toggleFollow(u.id)}
                        className="text-xs font-medium rounded-full px-3 py-1 bg-muted text-muted-foreground transition-colors"
                      >
                        {t("social.following")}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Profile;
