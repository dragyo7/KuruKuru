// ============================================================
// AgriChain Mock API Service Layer
// All data fetching is abstracted here for easy ML/backend swap
// ============================================================

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Types ----------

export interface HarvestRecommendation {
  id: string;
  crop: string;
  plantWindow: string;
  harvestWindow: string;
  confidence: number;
  reason: string;
  dataSource: string;
  lastUpdated: string;
}

export interface MarketPrice {
  id: string;
  crop: string;
  currentPrice: number;
  predictedPrice: number;
  trend: "up" | "down" | "stable";
  unit: string;
  confidence: number;
  dataSource: string;
  lastUpdated: string;
  reason: string;
}

export interface WeatherRisk {
  level: "low" | "medium" | "high";
  summary: string;
  alerts: string[];
  temperature: number;
  humidity: number;
  confidence: number;
  dataSource: string;
  lastUpdated: string;
  reason: string;
}

export interface SpoilageRisk {
  product: string;
  riskLevel: "low" | "medium" | "high";
  daysRemaining: number;
  recommendation: string;
  confidence: number;
  dataSource: string;
  lastUpdated: string;
  reason: string;
}

export interface MarketSuggestion {
  id: string;
  name: string;
  distance: string;
  bestCrop: string;
  demandLevel: "low" | "medium" | "high";
  confidence: number;
  dataSource: string;
  lastUpdated: string;
  reason: string;
}

export interface SocialPost {
  id: string;
  author: string;
  authorId: string;
  avatarUrl?: string;
  region?: string;
  verified?: boolean;
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked?: boolean;
  reported?: boolean;
}

export interface FarmerProfile {
  id: string;
  name: string;
  bio: string;
  avatarUrl?: string;
  region: string;
  cropPreferences: string[];
  storageType: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
}

export interface UserSummary {
  id: string;
  name: string;
  avatarUrl?: string;
  region: string;
  isFollowing: boolean;
}

// ---------- Dashboard APIs ----------
// ML_INTEGRATION_POINT_HARVEST

export async function getHarvestRecommendation(): Promise<HarvestRecommendation[]> {
  // ML_HARVEST_MODEL_OUTPUT
  await delay(800);
  return [
    { id: "1", crop: "Rice (Basmati)", plantWindow: "Jun – Jul", harvestWindow: "Oct – Nov", confidence: 92, reason: "Optimal soil moisture predicted based on historical rainfall data and current satellite imagery.", dataSource: "ICAR Soil Database + IMD", lastUpdated: new Date(Date.now() - 1800000).toISOString() },
    { id: "2", crop: "Wheat", plantWindow: "Nov – Dec", harvestWindow: "Mar – Apr", confidence: 87, reason: "Favorable temperature forecast aligns with wheat growth requirements for your region.", dataSource: "IMD Weather Model", lastUpdated: new Date(Date.now() - 3600000).toISOString() },
    { id: "3", crop: "Maize", plantWindow: "Feb – Mar", harvestWindow: "Jun – Jul", confidence: 78, reason: "Good rainfall expected with adequate soil nitrogen levels detected.", dataSource: "Regional Agri Lab", lastUpdated: new Date(Date.now() - 7200000).toISOString() },
  ];
}

// ML_INTEGRATION_POINT_PRICE
export async function getMarketPrices(): Promise<MarketPrice[]> {
  // ML_PRICE_FORECAST_MODEL
  await delay(600);
  return [
    { id: "1", crop: "Rice", currentPrice: 2200, predictedPrice: 2450, trend: "up", unit: "₹/quintal", confidence: 88, dataSource: "APMC + ML Model v2.1", lastUpdated: new Date(Date.now() - 900000).toISOString(), reason: "Increasing demand from export markets and lower production in southern states." },
    { id: "2", crop: "Wheat", currentPrice: 2015, predictedPrice: 1980, trend: "down", unit: "₹/quintal", confidence: 82, dataSource: "APMC + ML Model v2.1", lastUpdated: new Date(Date.now() - 900000).toISOString(), reason: "High government buffer stocks and stable supply chain." },
    { id: "3", crop: "Maize", currentPrice: 1850, predictedPrice: 1870, trend: "stable", unit: "₹/quintal", confidence: 75, dataSource: "APMC + ML Model v2.1", lastUpdated: new Date(Date.now() - 1800000).toISOString(), reason: "Steady demand with no significant supply disruptions expected." },
    { id: "4", crop: "Soybean", currentPrice: 3900, predictedPrice: 4200, trend: "up", unit: "₹/quintal", confidence: 91, dataSource: "APMC + ML Model v2.1", lastUpdated: new Date(Date.now() - 600000).toISOString(), reason: "Global soybean shortage and rising international prices." },
  ];
}

export async function getWeatherRisk(): Promise<WeatherRisk> {
  await delay(700);
  return {
    level: "medium",
    summary: "Moderate rainfall expected this week with occasional thunderstorms.",
    alerts: ["Heavy rain warning for Thursday", "Temperature drop expected over weekend"],
    temperature: 32,
    humidity: 74,
    confidence: 85,
    dataSource: "IMD + Regional Sensors",
    lastUpdated: new Date(Date.now() - 600000).toISOString(),
    reason: "Analysis based on IMD forecast models and 12 regional weather stations within 50km radius.",
  };
}

export async function getSpoilageRisks(): Promise<SpoilageRisk[]> {
  // ML_RISK_SCORING
  await delay(500);
  return [
    { product: "Tomatoes", riskLevel: "high", daysRemaining: 2, recommendation: "Sell immediately or process into paste", confidence: 94, dataSource: "IoT Sensors + ML", lastUpdated: new Date(Date.now() - 300000).toISOString(), reason: "Temperature in storage unit exceeded 28°C for 6+ hours. Ethylene levels rising." },
    { product: "Potatoes", riskLevel: "low", daysRemaining: 21, recommendation: "Store in cool, dark area", confidence: 89, dataSource: "IoT Sensors + ML", lastUpdated: new Date(Date.now() - 600000).toISOString(), reason: "Storage conditions optimal. Humidity and temperature within safe range." },
    { product: "Onions", riskLevel: "medium", daysRemaining: 8, recommendation: "Improve ventilation in storage", confidence: 81, dataSource: "IoT Sensors + ML", lastUpdated: new Date(Date.now() - 900000).toISOString(), reason: "Slight humidity increase detected. Ventilation adjustment recommended." },
  ];
}

export async function getMarketSuggestions(): Promise<MarketSuggestion[]> {
  // ML_RECOMMENDER_PERSONALIZATION
  await delay(650);
  return [
    { id: "1", name: "Azadpur Mandi", distance: "12 km", bestCrop: "Tomatoes", demandLevel: "high", confidence: 90, dataSource: "Live Mandi API", lastUpdated: new Date(Date.now() - 1200000).toISOString(), reason: "High tomato demand due to festival season. Current supply is 30% below average." },
    { id: "2", name: "Vashi APMC", distance: "28 km", bestCrop: "Onions", demandLevel: "medium", dataSource: "Live Mandi API", lastUpdated: new Date(Date.now() - 1800000).toISOString(), confidence: 78, reason: "Moderate onion demand. Prices stabilizing after recent supply increase." },
    { id: "3", name: "Koyambedu Market", distance: "45 km", bestCrop: "Rice", demandLevel: "high", confidence: 85, dataSource: "Live Mandi API", lastUpdated: new Date(Date.now() - 2400000).toISOString(), reason: "Rice demand consistently high. Premium for Basmati variety." },
  ];
}

// ---------- Social APIs ----------
// ML_SOCIAL_ANALYTICS

let mockPosts: SocialPost[] = [
  {
    id: "1",
    author: "Rajesh Kumar",
    authorId: "u1",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=RK",
    region: "Punjab",
    verified: true,
    content: "Just harvested our best rice yield this season! The new irrigation system really made a difference. 🌾",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    likes: 24,
    comments: 5,
  },
  {
    id: "2",
    author: "Priya Sharma",
    authorId: "u2",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=PS",
    region: "Maharashtra",
    verified: false,
    content: "Anyone else noticing unusual pest activity this month? Seeing more aphids than usual on wheat crops.",
    imageUrl: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&h=300&fit=crop",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    likes: 18,
    comments: 12,
  },
  {
    id: "3",
    author: "Amit Patel",
    authorId: "u3",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=AP",
    region: "Gujarat",
    verified: true,
    content: "Market prices for soybean looking very promising this week. Holding off on selling for now. 📈",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    likes: 31,
    comments: 8,
  },
];

export async function getSocialPosts(): Promise<SocialPost[]> {
  await delay(500);
  return [...mockPosts];
}

export async function createPost(content: string, imageUrl?: string): Promise<SocialPost> {
  await delay(300);
  const newPost: SocialPost = {
    id: String(Date.now()),
    author: "You",
    authorId: "me",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=ME",
    region: "Punjab",
    verified: false,
    content,
    imageUrl: imageUrl || undefined,
    timestamp: new Date().toISOString(),
    likes: 0,
    comments: 0,
  };
  mockPosts = [newPost, ...mockPosts];
  return newPost;
}

export async function likePost(postId: string): Promise<void> {
  await delay(200);
  mockPosts = mockPosts.map((p) => (p.id === postId ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked } : p));
}

export async function reportPost(postId: string): Promise<void> {
  await delay(200);
  mockPosts = mockPosts.map((p) => (p.id === postId ? { ...p, reported: true } : p));
}

// ---------- Follow APIs ----------

const followingSet = new Set<string>();

export async function followUser(userId: string): Promise<void> {
  await delay(300);
  followingSet.add(userId);
}

export async function unfollowUser(userId: string): Promise<void> {
  await delay(300);
  followingSet.delete(userId);
}

export async function getFollowers(_userId: string): Promise<UserSummary[]> {
  await delay(400);
  return [
    { id: "u1", name: "Rajesh Kumar", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=RK", region: "Punjab", isFollowing: followingSet.has("u1") },
    { id: "u2", name: "Priya Sharma", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=PS", region: "Maharashtra", isFollowing: followingSet.has("u2") },
  ];
}

export async function getFollowing(_userId: string): Promise<UserSummary[]> {
  await delay(400);
  return [
    { id: "u3", name: "Amit Patel", avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=AP", region: "Gujarat", isFollowing: true },
  ];
}

export function isFollowing(userId: string): boolean {
  return followingSet.has(userId);
}

// ---------- Profile APIs ----------
// ML_RECOMMENDER_PERSONALIZATION

let mockProfile: FarmerProfile = {
  id: "me",
  name: "Rajesh Kumar",
  bio: "Progressive farmer specializing in rice and wheat cultivation. Passionate about sustainable farming.",
  avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=RK&backgroundColor=2d6a4f",
  region: "Punjab, India",
  cropPreferences: ["Rice", "Wheat"],
  storageType: "Cold Storage",
  followersCount: 142,
  followingCount: 89,
  postsCount: 23,
};

export async function getProfile(): Promise<FarmerProfile> {
  await delay(400);
  return { ...mockProfile };
}

export async function saveProfile(profile: FarmerProfile): Promise<FarmerProfile> {
  await delay(500);
  mockProfile = { ...profile };
  return { ...mockProfile };
}
