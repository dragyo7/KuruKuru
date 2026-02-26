

# AgriChain – Agriculture Intelligence Platform

## Overview
A mobile-first single-page web application serving as an agriculture intelligence dashboard with social features and farmer profiles. Built with a modular, API-ready architecture designed for future ML model integration.

---

## Navigation & Layout
- **Mobile**: Bottom navigation bar with 3 tabs (Home, Social, Profile) + top header with AgriChain branding
- **Desktop**: Top navbar with tab navigation, responsive container layout
- Clean, modern design with an earthy green/amber agricultural color palette

---

## Page 1: Home – ML Feature Dashboard
A card-based dashboard displaying agricultural intelligence data:

- **🌾 Harvest Recommendation Card** – Suggested crops, optimal planting/harvest windows
- **📈 Market Price Prediction Card** – Price trends and forecasts for key crops
- **🌦 Weather Risk Analysis Card** – Weather alerts and risk levels
- **📦 Spoilage Risk Card** – Storage risk indicators and recommendations
- **🚚 Market Suggestion Card** – Nearest/best markets to sell produce

Each card will:
- Fetch data from a mock API service layer
- Display loading skeletons and error states
- Accept props for easy swapping with real ML outputs later
- Use a consistent dashboard tile design

---

## Page 2: Social Interaction Feed
A simple farmer social feed (Twitter-style):

- **Post creation** – Text input with optional image URL field
- **Feed** – Scrollable list of posts with like and comment buttons
- **Post component** – Reusable, showing author, content, image, timestamp, like/comment counts
- All posts managed via centralized context state and fetched through API layer
- Code comments marking ML integration hooks (sentiment analysis, fake news detection, crop disease detection, trending topics)

---

## Page 3: Profile
An editable farmer profile:

- Display and edit: Farmer Name, Region, Crop Preferences, Storage Type
- Save button triggering an API call
- Profile data loaded from and saved to the mock API service
- Placeholder comments for future ML personalization, behavior analytics, and risk profiling

---

## Architecture
- **`/services/api.ts`** – All mock API functions with async/await (getHarvestRecommendation, getWeatherRisk, getMarketPrices, getSocialPosts, saveProfile, etc.)
- **`/context/AppContext.tsx`** – Centralized state for social posts and profile data
- **`/components/cards/`** – Reusable dashboard card components
- **`/components/social/`** – Feed and Post components
- **`/components/profile/`** – ProfileForm component
- **`/components/`** – Navbar, BottomNav shared layout components
- Zero hardcoded data in UI components; all data flows from the API layer

