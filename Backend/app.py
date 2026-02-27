import os
import sys
import json
import uuid
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor
from dotenv import load_dotenv
from supabase import create_client, Client

# ---------------------------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------------------------
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] SUPABASE_URL and SUPABASE_KEY must be set in .env file!")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Flask app setup
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
FRONTEND_DIR = os.path.join(PROJECT_DIR, "Frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)

# ---------------------------------------------------------------------------
# Supabase client
# ---------------------------------------------------------------------------
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("[BOOT] Supabase connected OK")

# ---------------------------------------------------------------------------
# Paths to datasets
# ---------------------------------------------------------------------------
DATASET_DIR = os.path.join(PROJECT_DIR, "Dataset")
PRICE_CSV = os.path.join(DATASET_DIR, "9ef84268-d588-465a-a308-a864a43d0070.csv")
WEATHER_CSV = os.path.join(DATASET_DIR, "TNweather_1.8M[1].csv")

# ---------------------------------------------------------------------------
# Global ML artefacts (populated on startup)
# ---------------------------------------------------------------------------
price_data_raw = None
price_model = None
price_encoders = {}
price_features = []
harvest_model = None
weather_data = None
spoilage_model = None
spoilage_data = None
spoilage_encoders = {}

# ---------------------------------------------------------------------------
# Load & prepare data / models on startup
# ---------------------------------------------------------------------------

def load_price_model():
    """Replicate the Mandi Market notebook logic."""
    global price_data_raw, price_model, price_encoders, price_features

    print("[BOOT] Loading price dataset ...")
    data = pd.read_csv(PRICE_CSV)
    data.columns = data.columns.str.strip()

    string_cols = ["State", "District", "Market", "Commodity", "Variety", "Grade"]
    for col in string_cols:
        data[col] = (
            data[col].fillna("").astype(str).str.strip().str.lower()
        )

    # Filter Tamil Nadu (matches notebook)
    data = data[data["State"].str.contains("tamil", na=False)]
    if len(data) == 0:
        print("[WARN] No Tamil Nadu data found in price CSV.")
        return

    # Parse dates
    data["Arrival_Date"] = pd.to_datetime(data["Arrival_Date"], errors="coerce", dayfirst=True)
    data = data.dropna(subset=["Arrival_Date"])
    data = data.sort_values(["Market", "Commodity", "Arrival_Date"])

    # Feature engineering
    data["day"] = data["Arrival_Date"].dt.day
    data["month"] = data["Arrival_Date"].dt.month
    data["weekday"] = data["Arrival_Date"].dt.weekday
    data["lag_7"] = (
        data.groupby(["Market", "Commodity"])["Modal_x0020_Price"]
        .transform(lambda x: x.rolling(7, min_periods=1).mean())
    )
    data = data.dropna(subset=["Modal_x0020_Price"])

    price_data_raw = data.copy()

    # Encode
    data_model = data.copy()
    for col in string_cols:
        le = LabelEncoder()
        data_model[col] = le.fit_transform(data_model[col])
        price_encoders[col] = le

    price_features.clear()
    price_features.extend([
        "State", "District", "Market",
        "Commodity", "Variety", "Grade",
        "day", "month", "weekday", "lag_7",
    ])

    X = data_model[price_features]
    y = data_model["Modal_x0020_Price"]

    if len(X) < 20:
        print("[WARN] Not enough data to train price model.")
        return

    X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, shuffle=False)

    model = XGBRegressor(n_estimators=300, learning_rate=0.05, max_depth=6, random_state=42)
    model.fit(X_train, y_train)
    price_model = model
    print(f"[BOOT] Price model trained OK  ({len(X_train)} samples)")


def load_harvest_model():
    """Replicate the Harvest notebook logic."""
    global harvest_model, weather_data

    print("[BOOT] Loading weather dataset (this may take a moment) ...")
    data = pd.read_csv(WEATHER_CSV)
    data["time"] = pd.to_datetime(data["time"])

    # Keep only needed columns
    data = data[["time", "temperature_2m", "relative_humidity_2m", "precipitation", "cloud_cover"]].copy()

    # Build label (same rule as notebook)
    data["harvest_label"] = (
        (data["precipitation"] == 0) &
        (data["relative_humidity_2m"] < 80) &
        (data["temperature_2m"].between(20, 35))
    ).astype(int)

    X_train = data[["temperature_2m", "relative_humidity_2m", "precipitation", "cloud_cover"]]
    y_train = data["harvest_label"]

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    harvest_model = model

    # Keep weather data for future prediction
    data["month"] = data["time"].dt.month
    data["day"] = data["time"].dt.day
    weather_data = data

    print(f"[BOOT] Harvest model trained OK  ({len(X_train)} samples)")


def load_spoilage_model():
    """Replicate the Spoilage notebook logic."""
    global spoilage_model, spoilage_data, spoilage_encoders

    print("[BOOT] Training spoilage model ...")
    data = pd.read_csv(PRICE_CSV)
    data.columns = data.columns.str.strip()

    for col in ["State", "District", "Market", "Commodity", "Variety"]:
        data[col] = data[col].fillna("").astype(str).str.strip().str.lower()

    data = data[data["State"].str.contains("tamil", na=False)]
    if len(data) == 0:
        print("[WARN] No Tamil Nadu data for spoilage model.")
        return

    data["Arrival_Date"] = pd.to_datetime(data["Arrival_Date"], errors="coerce", dayfirst=True)
    data = data.dropna(subset=["Arrival_Date"])
    data = data.sort_values(["Market", "Arrival_Date"])

    data["lag_7"] = data.groupby("Market")["Modal_x0020_Price"].transform(
        lambda x: x.shift(1).rolling(7).mean()
    )
    data["month"] = data["Arrival_Date"].dt.month
    data["day"] = data["Arrival_Date"].dt.day
    data["weekday"] = data["Arrival_Date"].dt.weekday
    data = data.dropna()

    # Perishability index (from notebook)
    perishability_index = {
        "onion green": 0.85, "deshi red": 0.35, "bellary": 0.30, "hosur red": 0.30,
        "red nanital": 0.35, "ranchi": 0.40, "darjeeling": 0.40, "mysore": 0.40,
        "amaranthus": 0.95, "mint(pudina)": 0.95, "green peas": 0.75, "cowpea (veg)": 0.80,
        "green chilly": 0.85, "beans (whole)": 0.80, "cluster beans": 0.80,
        "indian beans (seam)": 0.80, "avare (w)": 0.80, "bhindi": 0.85, "drumstick": 0.75,
        "capsicum": 0.80, "cucumbar": 0.90, "bitter gourd": 0.85,
        "ridgeguard(tori)": 0.85, "snakeguard": 0.85, "bottle gourd": 0.80,
        "gouard": 0.80, "turnip": 0.70, "raddish": 0.75, "knool khol": 0.65,
        "chow chow": 0.70, "beetroot": 0.55, "colacasia": 0.50,
        "yam (ratalu)": 0.45, "elephant yam (suran)": 0.40, "tapioca": 0.50,
        "banana - green": 0.90, "mango - raw-ripe": 0.90, "papaya": 0.95,
        "guava allahabad": 0.85, "custard apple(sharifa)": 0.95, "pine apple": 0.85,
        "water melon": 0.95, "mousambi": 0.80, "lime": 0.75, "lemon": 0.75,
        "pomogranate": 0.70, "anjura": 0.85, "pears": 0.80, "sapota": 0.90,
        "karbhuja": 0.95, "jack fruit": 0.80, "amla": 0.60,
        "coconut": 0.25, "tamarind fruit": 0.20, "tender coconut": 0.70,
        "marigold(calcutta)": 0.95, "rose (local)": 0.95, "tube rose (loose)": 0.98,
        "tube flower": 0.98, "jasmine": 0.99, "mashrooms": 1.00, "pumpkin": 0.35,
        "average": 0.50, "i sort": 0.50, "deshi": 0.50, "pusakesar": 0.50,
        "local": 0.60, "big (with shell)": 0.55, "bold": 0.55, "besrai": 0.50,
        "annabesahai": 0.50, "american": 0.50, "round": 0.50, "kakada": 0.85,
    }

    data["perishability"] = data["Variety"].map(perishability_index).fillna(0.6)

    storage_days = 3
    humidity_factor = 0.70
    data["market_frequency"] = data.groupby("Market")["Modal_x0020_Price"].transform("count")
    data["distance_proxy"] = 1 / data["market_frequency"]

    data["spoilage_risk"] = data["perishability"] * storage_days * humidity_factor + data["distance_proxy"]
    sr_min = data["spoilage_risk"].min()
    sr_max = data["spoilage_risk"].max()
    if sr_max > sr_min:
        data["spoilage_risk"] = (data["spoilage_risk"] - sr_min) / (sr_max - sr_min)
    else:
        data["spoilage_risk"] = 0.5

    # Encode for model
    for col in ["District", "Market", "Commodity"]:
        le = LabelEncoder()
        data[col + "_enc"] = le.fit_transform(data[col])
        spoilage_encoders[col] = le

    # Train spoilage model
    from xgboost import XGBRegressor as XGBReg
    spoil_features = ["perishability", "distance_proxy"]
    X_spoil = data[spoil_features]
    y_spoil = data["spoilage_risk"]
    X_tr, _, y_tr, _ = train_test_split(X_spoil, y_spoil, test_size=0.2, shuffle=False)
    s_model = XGBReg(n_estimators=100, max_depth=4)
    s_model.fit(X_tr, y_tr)
    spoilage_model = s_model

    # Store data + perishability index for later use
    spoilage_data = {
        "df": data,
        "perishability_index": perishability_index,
    }

    print(f"[BOOT] Spoilage model trained OK  ({len(X_tr)} samples)")


# ---------------------------------------------------------------------------
# Helper: get unique values for dropdowns
# ---------------------------------------------------------------------------

def get_dropdown_options():
    """Return unique states, districts, commodities from price data."""
    if price_data_raw is None:
        return {"states": [], "districts": {}, "commodities": {}}

    states = sorted(price_data_raw["State"].unique().tolist())

    districts = {}
    for state in states:
        dists = sorted(
            price_data_raw[price_data_raw["State"] == state]["District"].unique().tolist()
        )
        districts[state] = dists

    commodities = {}
    for _, row in price_data_raw[["District", "Commodity"]].drop_duplicates().iterrows():
        d = row["District"]
        c = row["Commodity"]
        commodities.setdefault(d, set()).add(c)
    commodities = {k: sorted(list(v)) for k, v in commodities.items()}

    return {"states": states, "districts": districts, "commodities": commodities}


# ---------------------------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------------------------

@app.route("/api/spoilage-commodities", methods=["GET"])
def spoilage_commodities():
    """Return unique commodities available for spoilage prediction."""
    if spoilage_data is None:
        return jsonify({"commodities": []})
    df = spoilage_data["df"]
    commodities = sorted(df["Commodity"].unique().tolist())
    return jsonify({"commodities": commodities})


@app.route("/api/predict-spoilage", methods=["POST"])
def predict_spoilage():
    if spoilage_model is None or spoilage_data is None:
        return jsonify({"error": "Spoilage model not loaded."}), 500

    body = request.get_json(force=True)
    commodity = body.get("commodity", "").strip().lower()
    storage_days = body.get("storage_days", 3)
    humidity = body.get("humidity", 70)

    if not commodity:
        return jsonify({"error": "Commodity is required."}), 400

    try:
        storage_days = int(storage_days)
        humidity = int(humidity)
    except (ValueError, TypeError):
        storage_days = 3
        humidity = 70

    # Clamp values
    storage_days = max(1, min(30, storage_days))
    humidity = max(10, min(100, humidity))

    df = spoilage_data["df"]
    p_index = spoilage_data["perishability_index"]

    # Get perishability for this commodity from its varieties
    comm_data = df[df["Commodity"] == commodity]
    if len(comm_data) == 0:
        return jsonify({"error": f"No data for commodity: {commodity}"}), 404

    # Average perishability for this commodity
    avg_perishability = float(comm_data["perishability"].mean())

    # Average distance proxy
    avg_distance = float(comm_data["distance_proxy"].mean())

    # Calculate spoilage risk with user's inputs
    humidity_factor = humidity / 100.0
    raw_risk = avg_perishability * storage_days * humidity_factor + avg_distance

    # Normalize using training data range
    sr_min = float(df["spoilage_risk"].min())
    sr_max = float(df["spoilage_risk"].max())
    # But we need to normalize against the range of the formula, not the normalized data
    # Recalculate with same formula
    train_raw_min = df["perishability"].min() * 1 * 0.1 + df["distance_proxy"].min()
    train_raw_max = df["perishability"].max() * 30 * 1.0 + df["distance_proxy"].max()
    if train_raw_max > train_raw_min:
        spoilage_risk = (raw_risk - train_raw_min) / (train_raw_max - train_raw_min)
    else:
        spoilage_risk = 0.5
    spoilage_risk = max(0.0, min(1.0, spoilage_risk))

    # Determine risk level
    if spoilage_risk > 0.7:
        risk_level = "HIGH"
    elif spoilage_risk > 0.4:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    # Build reasons
    reasons = []
    if avg_perishability > 0.7:
        reasons.append(f"This commodity is highly perishable (score: {round(avg_perishability, 2)})")
    elif avg_perishability > 0.4:
        reasons.append(f"This commodity has moderate perishability (score: {round(avg_perishability, 2)})")
    else:
        reasons.append(f"This commodity has low perishability (score: {round(avg_perishability, 2)})")

    if storage_days > 5:
        reasons.append(f"Long storage ({storage_days} days) significantly increases spoilage risk")
    elif storage_days > 2:
        reasons.append(f"Storage duration ({storage_days} days) moderately affects risk")
    else:
        reasons.append(f"Short storage ({storage_days} day) keeps risk minimal")

    if humidity > 80:
        reasons.append(f"High humidity ({humidity}%) accelerates spoilage")
    elif humidity > 60:
        reasons.append(f"Moderate humidity ({humidity}%) has some impact on spoilage")
    else:
        reasons.append(f"Low humidity ({humidity}%) helps preserve the commodity")

    return jsonify({
        "commodity": commodity,
        "storage_days": storage_days,
        "humidity": humidity,
        "spoilage_risk": round(spoilage_risk, 3),
        "risk_level": risk_level,
        "perishability_score": round(avg_perishability, 2),
        "reasons": reasons,
    })


@app.route("/api/dropdown-options", methods=["GET"])
def dropdown_options():
    opts = get_dropdown_options()
    return jsonify(opts)


@app.route("/api/register", methods=["POST"])
def register_farmer():
    body = request.get_json(force=True)
    farmer_id = body.get("farmer_id", "").strip()
    farmer_name = body.get("farmer_name", "").strip()
    mobile = body.get("mobile", "").strip()
    district = body.get("district", "").strip().lower()

    if not all([farmer_id, farmer_name, mobile, district]):
        return jsonify({"error": "All fields are required."}), 400

    try:
        # Check if farmer already exists
        existing = supabase.table("farmers").select("*").eq("farmer_id", farmer_id).execute()
        if existing.data and len(existing.data) > 0:
            return jsonify({"error": "Farmer ID already exists. Please login instead."}), 409

        # Insert new farmer
        result = supabase.table("farmers").insert({
            "farmer_id": farmer_id,
            "farmer_name": farmer_name,
            "mobile": mobile,
            "district": district,
        }).execute()

        farmer = result.data[0]
        return jsonify({"message": "Registered successfully!", "farmer": farmer})

    except Exception as e:
        print(f"[ERROR] Registration failed: {e}")
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500


@app.route("/api/login", methods=["POST"])
def login_farmer():
    body = request.get_json(force=True)
    farmer_id = body.get("farmer_id", "").strip()
    mobile = body.get("mobile", "").strip()

    try:
        result = supabase.table("farmers").select("*").eq("farmer_id", farmer_id).execute()

        if not result.data or len(result.data) == 0:
            return jsonify({"error": "Farmer not found. Please register first."}), 404

        farmer = result.data[0]
        if farmer["mobile"] != mobile:
            return jsonify({"error": "Invalid mobile number."}), 401

        return jsonify({"message": "Login successful!", "farmer": farmer})

    except Exception as e:
        print(f"[ERROR] Login failed: {e}")
        return jsonify({"error": f"Login failed: {str(e)}"}), 500


@app.route("/api/farmer/<farmer_id>", methods=["GET"])
def get_farmer(farmer_id):
    try:
        result = supabase.table("farmers").select("*").eq("farmer_id", farmer_id).execute()
        if not result.data or len(result.data) == 0:
            return jsonify({"error": "Farmer not found."}), 404
        return jsonify({"farmer": result.data[0]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/predict-price", methods=["POST"])
def predict_price():
    if price_model is None:
        return jsonify({"error": "Price model not loaded."}), 500

    body = request.get_json(force=True)
    district = body.get("district", "").strip().lower()
    commodity = body.get("commodity", "").strip().lower()

    if not district or not commodity:
        return jsonify({"error": "District and commodity are required."}), 400

    # Filter to district data
    district_data = price_data_raw[price_data_raw["District"] == district]
    if len(district_data) == 0:
        return jsonify({"error": f"No data for district: {district}"}), 404

    # Top 3 markets by volume
    market_counts = district_data.groupby("Market").size().sort_values(ascending=False)
    nearest_markets = market_counts.head(3).index.tolist()
    if not nearest_markets:
        return jsonify({"error": "No markets found in this district."}), 404

    # Prepare encoded data for prediction
    string_cols = ["State", "District", "Market", "Commodity", "Variety", "Grade"]
    data_model = district_data.copy()
    for col in string_cols:
        le = price_encoders.get(col)
        if le is not None:
            try:
                data_model[col] = le.transform(data_model[col])
            except ValueError:
                data_model[col] = 0

    future_date = datetime.now() + timedelta(days=7)
    future_day = future_date.day
    future_month = future_date.month
    future_weekday = future_date.weekday()

    results = {}
    for market_name in nearest_markets:
        try:
            market_encoded = price_encoders["Market"].transform([market_name])[0]
        except ValueError:
            continue

        market_data = data_model[data_model["Market"] == market_encoded].sort_values("Arrival_Date")
        if len(market_data) == 0:
            continue

        latest_row = market_data.iloc[-1]

        input_data = pd.DataFrame([[
            latest_row["State"],
            latest_row["District"],
            latest_row["Market"],
            latest_row["Commodity"],
            latest_row["Variety"],
            latest_row["Grade"],
            future_day,
            future_month,
            future_weekday,
            latest_row["lag_7"],
        ]], columns=price_features)

        predicted_price = float(price_model.predict(input_data)[0])
        results[market_name] = round(predicted_price, 2)

    if not results:
        return jsonify({"error": "Could not generate predictions."}), 500

    best_market = max(results, key=lambda x: results[x])

    return jsonify({
        "district": district,
        "commodity": commodity,
        "predictions": results,
        "best_market": best_market,
        "best_price": results[best_market],
        "prediction_date": future_date.strftime("%Y-%m-%d"),
    })


@app.route("/api/predict-harvest", methods=["POST"])
def predict_harvest():
    if harvest_model is None:
        return jsonify({"error": "Harvest model not loaded."}), 500

    # Build future dates for the next year
    today = pd.to_datetime(datetime.today().date())
    end_of_year = pd.to_datetime(f"{today.year}-12-31")
    future_dates = pd.date_range(start=today, end=end_of_year, freq="D")
    future = pd.DataFrame({"time": future_dates})
    future["month"] = future["time"].dt.month
    future["day"] = future["time"].dt.day

    # Average historical weather per month/day
    avg_weather = weather_data.groupby(["month", "day"])[
        ["temperature_2m", "relative_humidity_2m", "precipitation", "cloud_cover"]
    ].mean().reset_index()

    future = pd.merge(future, avg_weather, on=["month", "day"], how="left")
    future = future.dropna()

    X_future = future[["temperature_2m", "relative_humidity_2m", "precipitation", "cloud_cover"]]
    future["harvest_prediction"] = harvest_model.predict(X_future)

    # Find harvest windows (consecutive good days, >= 3)
    harvest_days = future[future["harvest_prediction"] == 1].copy()
    if len(harvest_days) == 0:
        return jsonify({"error": "No upcoming harvest window found."}), 404

    harvest_days["gap"] = harvest_days["time"].diff().dt.days
    harvest_days["window"] = (harvest_days["gap"] > 1).cumsum()
    windows = harvest_days.groupby("window")["time"].agg(["min", "max"]).reset_index()
    windows["days"] = (windows["max"] - windows["min"]).dt.days + 1
    windows = windows[windows["days"] >= 3]

    if len(windows) == 0:
        return jsonify({"error": "No suitable harvest window (>=3 days) found."}), 404

    next_window = windows.iloc[0]
    start_date = next_window["min"]
    end_date = next_window["max"]

    # Average weather during the window
    window_weather = future[
        (future["time"] >= start_date) & (future["time"] <= end_date)
    ]
    avg_temp = round(float(window_weather["temperature_2m"].mean()), 1)
    avg_humidity = round(float(window_weather["relative_humidity_2m"].mean()), 1)
    avg_precip = round(float(window_weather["precipitation"].mean()), 3)
    avg_cloud = round(float(window_weather["cloud_cover"].mean()), 1)

    # SHAP-like reasons
    reasons = []
    if avg_humidity < 80:
        reasons.append("Moderate humidity prevents crop spoilage")
    if avg_precip < 0.1:
        reasons.append("No rainfall expected")
    if 20 <= avg_temp <= 35:
        reasons.append("Ideal temperature protects crop quality")
    if avg_cloud < 70:
        reasons.append("Clear weather reduces rain risk")
    if not reasons:
        reasons.append("Favorable weather conditions overall")

    # Get all windows (up to 5)
    all_windows = []
    for _, w in windows.head(5).iterrows():
        all_windows.append({
            "start": w["min"].strftime("%Y-%m-%d"),
            "end": w["max"].strftime("%Y-%m-%d"),
            "days": int(w["days"]),
        })

    return jsonify({
        "recommended_window": {
            "start": start_date.strftime("%Y-%m-%d"),
            "end": end_date.strftime("%Y-%m-%d"),
            "days": int(next_window["days"]),
        },
        "weather": {
            "avg_temperature": avg_temp,
            "avg_humidity": avg_humidity,
            "avg_precipitation": avg_precip,
            "avg_cloud_cover": avg_cloud,
        },
        "reasons": reasons,
        "all_windows": all_windows,
    })


# ---------------------------------------------------------------------------
# Social Media endpoints (Supabase)
# ---------------------------------------------------------------------------

@app.route("/api/posts", methods=["GET"])
def get_posts():
    try:
        result = supabase.table("posts").select("*").order("created_at", desc=True).limit(50).execute()
        return jsonify({"posts": result.data or []})
    except Exception as e:
        print(f"[ERROR] Failed to fetch posts: {e}")
        return jsonify({"posts": []})


@app.route("/api/posts", methods=["POST"])
def create_post():
    body = request.get_json(force=True)
    farmer_id = body.get("farmer_id", "").strip()
    content = body.get("content", "").strip()
    image_url = body.get("image_url", "").strip()

    if not farmer_id or not content:
        return jsonify({"error": "farmer_id and content are required."}), 400

    try:
        # Get farmer name from Supabase
        farmer_result = supabase.table("farmers").select("farmer_name").eq("farmer_id", farmer_id).execute()
        farmer_name = "Unknown Farmer"
        if farmer_result.data and len(farmer_result.data) > 0:
            farmer_name = farmer_result.data[0]["farmer_name"]

        # Insert post
        result = supabase.table("posts").insert({
            "farmer_id": farmer_id,
            "farmer_name": farmer_name,
            "content": content,
            "image_url": image_url,
        }).execute()

        post = result.data[0]
        return jsonify({"message": "Post created!", "post": post}), 201

    except Exception as e:
        print(f"[ERROR] Failed to create post: {e}")
        return jsonify({"error": f"Failed to create post: {str(e)}"}), 500


# ---------------------------------------------------------------------------
# Frontend serving routes (MUST be after API routes to avoid catch-all)
# ---------------------------------------------------------------------------

@app.route("/")
def serve_index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(FRONTEND_DIR, filename)


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("  Farmer's Smart Harvest & Price Prediction Server")
    print("  Database: Supabase (cloud PostgreSQL)")
    print("=" * 60)

    load_price_model()
    load_harvest_model()
    load_spoilage_model()

    print("\n[READY] Server starting on http://localhost:5000")
    print("        Open http://localhost:5000 in your browser!")
    print("=" * 60)

    app.run(debug=False, port=5000)
