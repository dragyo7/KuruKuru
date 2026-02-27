import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, User } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const ProfileForm: React.FC = () => {
  const { profile, profileLoading, fetchProfile, updateProfile } = useAppContext();
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", bio: "", region: "", cropPreferences: "", storageType: "" });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        bio: profile.bio || "",
        region: profile.region,
        cropPreferences: profile.cropPreferences.join(", "),
        storageType: profile.storageType,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    // ML Integration Hook: personalized recommendations, behavior analytics, risk profiling
    // ML_RECOMMENDER_PERSONALIZATION
    await updateProfile({
      ...profile,
      name: form.name,
      bio: form.bio,
      region: form.region,
      cropPreferences: form.cropPreferences.split(",").map((s) => s.trim()).filter(Boolean),
      storageType: form.storageType,
    });
    toast.success(t("profile.saved"));
  };

  if (profileLoading && !profile) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
        <CardTitle className="font-sans text-lg">{t("profile.farmerProfile")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("profile.name")}</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">{t("profile.bio")}</Label>
          <Textarea id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} className="resize-none" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">{t("profile.region")}</Label>
          <Input id="region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="crops">{t("profile.crops")}</Label>
          <Input id="crops" placeholder="Rice, Wheat, Maize" value={form.cropPreferences} onChange={(e) => setForm({ ...form, cropPreferences: e.target.value })} />
          <p className="text-xs text-muted-foreground">{t("profile.cropsHint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="storage">{t("profile.storage")}</Label>
          <Input id="storage" value={form.storageType} onChange={(e) => setForm({ ...form, storageType: e.target.value })} />
        </div>
        <Button onClick={handleSave} disabled={profileLoading} className="w-full">
          <Save className="h-4 w-4 mr-2" /> {t("profile.save")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
