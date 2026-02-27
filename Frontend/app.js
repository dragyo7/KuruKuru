/* ============================================================
   KisanSmart — Frontend JavaScript
   ============================================================ */

const API_BASE = "/api";

// Current logged-in farmer
let currentFarmer = null;

// Dropdown data cache
let dropdownData = null;

// Current language (default: English)
let currentLang = localStorage.getItem("kisansmart_lang") || "en";

/* =============================================================
   TRANSLATION ENGINE
   ============================================================= */

function t(key) {
    const entry = TRANSLATIONS[key];
    if (!entry) return key;
    return entry[currentLang] || entry["en"] || key;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("kisansmart_lang", lang);

    // Update all data-i18n text content
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        el.textContent = t(key);
    });

    // Update all data-i18n-placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        el.placeholder = t(key);
    });

    // Update language switcher buttons (both auth + app)
    document.querySelectorAll(".lang-btn, .lang-btn-sm").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    // Update welcome message if logged in
    if (currentFarmer) {
        document.getElementById("welcome-msg").textContent =
            `${t("welcome")}, ${capitalize(currentFarmer.farmer_name)}!`;
    }

    // Update HTML lang attribute
    document.documentElement.lang = lang === "hi" ? "hi" : lang === "ta" ? "ta" : "en";
}

// Apply language on page load
document.addEventListener("DOMContentLoaded", () => {
    setLanguage(currentLang);

    // Humidity slider display
    const humSlider = document.getElementById("spoil-humidity");
    const humDisplay = document.getElementById("humidity-display");
    if (humSlider && humDisplay) {
        humSlider.addEventListener("input", () => {
            humDisplay.textContent = humSlider.value + "%";
        });
    }
});

/* =============================================================
   AUTH — Login / Register
   ============================================================= */

function showAuthForm(form) {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const toggleLogin = document.getElementById("toggle-login");
    const toggleRegister = document.getElementById("toggle-register");
    const authError = document.getElementById("auth-error");

    authError.classList.add("hidden");

    if (form === "login") {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        toggleLogin.classList.add("active");
        toggleRegister.classList.remove("active");
    } else {
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        toggleLogin.classList.remove("active");
        toggleRegister.classList.add("active");
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById("register-btn");
    const authError = document.getElementById("auth-error");

    toggleLoading(btn, true);
    authError.classList.add("hidden");

    const body = {
        farmer_name: document.getElementById("reg-farmer-name").value.trim(),
        farmer_id: document.getElementById("reg-farmer-id").value.trim(),
        mobile: document.getElementById("reg-mobile").value.trim(),
        district: document.getElementById("reg-district").value.trim(),
    };

    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok) {
            showAuthError(data.error || "Registration failed.");
            return;
        }

        currentFarmer = data.farmer;
        enterApp();
    } catch (err) {
        showAuthError(t("server_error"));
    } finally {
        toggleLoading(btn, false);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById("login-btn");
    const authError = document.getElementById("auth-error");

    toggleLoading(btn, true);
    authError.classList.add("hidden");

    const body = {
        farmer_id: document.getElementById("login-farmer-id").value.trim(),
        mobile: document.getElementById("login-mobile").value.trim(),
    };

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok) {
            showAuthError(data.error || "Login failed.");
            return;
        }

        currentFarmer = data.farmer;
        enterApp();
    } catch (err) {
        showAuthError(t("server_error"));
    } finally {
        toggleLoading(btn, false);
    }
}

function showAuthError(msg) {
    const el = document.getElementById("auth-error");
    el.textContent = msg;
    el.classList.remove("hidden");
}

function enterApp() {
    document.getElementById("auth-screen").classList.remove("active");
    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("app-screen").classList.remove("hidden");

    // Populate welcome
    document.getElementById("welcome-msg").textContent =
        `${t("welcome")}, ${capitalize(currentFarmer.farmer_name)}!`;

    // Populate profile
    document.getElementById("profile-name").textContent = currentFarmer.farmer_name;
    document.getElementById("profile-id").textContent = currentFarmer.farmer_id;
    document.getElementById("profile-mobile").textContent = currentFarmer.mobile;
    document.getElementById("profile-district").textContent = currentFarmer.district;
    document.getElementById("profile-created").textContent =
        new Date(currentFarmer.created_at).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric"
        });

    // Re-apply translations for the app screen
    setLanguage(currentLang);

    // Load dropdown options
    loadDropdownOptions();

    // Load spoilage commodities
    loadSpoilageCommodities();

    // Load posts
    loadPosts();
}

function handleLogout() {
    currentFarmer = null;
    document.getElementById("app-screen").classList.add("hidden");
    document.getElementById("auth-screen").classList.remove("hidden");
    document.getElementById("auth-screen").classList.add("active");

    // Reset forms
    document.getElementById("login-form").reset();
    document.getElementById("register-form").reset();
    showAuthForm("login");

    // Reset results
    document.getElementById("harvest-result").classList.add("hidden");
    document.getElementById("price-result").classList.add("hidden");
    document.getElementById("spoilage-result").classList.add("hidden");

    // Re-apply translations
    setLanguage(currentLang);
}

/* =============================================================
   TAB NAVIGATION
   ============================================================= */

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Update panes
    document.querySelectorAll(".tab-pane").forEach(pane => {
        const isActive = pane.id === `tab-${tabName}`;
        pane.classList.toggle("active", isActive);
        pane.classList.toggle("hidden", !isActive);
    });

    // Load posts when switching to social tab
    if (tabName === "social") loadPosts();
}

/* =============================================================
   DROPDOWN OPTIONS
   ============================================================= */

async function loadDropdownOptions() {
    try {
        const res = await fetch(`${API_BASE}/dropdown-options`);
        dropdownData = await res.json();
        populateDistrictDropdown();
    } catch (err) {
        console.error("Failed to load dropdown options:", err);
    }
}

function populateDistrictDropdown() {
    const districtSelect = document.getElementById("select-district");
    districtSelect.innerHTML = `<option value="">${t("select_district")}</option>`;

    if (!dropdownData) return;

    // Flatten all districts from all states
    const allDistricts = new Set();
    for (const state of Object.keys(dropdownData.districts || {})) {
        for (const d of dropdownData.districts[state]) {
            allDistricts.add(d);
        }
    }

    // If farmer has a district, put it first
    const sorted = [...allDistricts].sort();
    if (currentFarmer && currentFarmer.district) {
        const fd = currentFarmer.district.toLowerCase();
        const idx = sorted.indexOf(fd);
        if (idx > -1) {
            sorted.splice(idx, 1);
            sorted.unshift(fd);
        }
    }

    for (const d of sorted) {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = capitalize(d);
        districtSelect.appendChild(opt);
    }

    // Pre-select farmer's district
    if (currentFarmer && currentFarmer.district) {
        districtSelect.value = currentFarmer.district.toLowerCase();
        onDistrictChange();
    }
}

function onDistrictChange() {
    const district = document.getElementById("select-district").value;
    const commoditySelect = document.getElementById("select-commodity");
    commoditySelect.innerHTML = `<option value="">${t("select_commodity")}</option>`;

    if (!district || !dropdownData || !dropdownData.commodities) return;

    const commodities = dropdownData.commodities[district] || [];
    for (const c of commodities) {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = capitalize(c);
        commoditySelect.appendChild(opt);
    }
}

/* =============================================================
   HARVEST PREDICTION
   ============================================================= */

function translateReason(reason) {
    const reasonMap = {
        "Moderate humidity prevents crop spoilage": "reason_humidity",
        "No rainfall expected": "reason_no_rain",
        "Ideal temperature protects crop quality": "reason_temp",
        "Clear weather reduces rain risk": "reason_clear",
        "Favorable weather conditions overall": "reason_favorable",
    };
    const key = reasonMap[reason];
    return key ? t(key) : reason;
}

async function predictHarvest() {
    const btn = document.getElementById("btn-harvest");
    const resultArea = document.getElementById("harvest-result");

    toggleLoading(btn, true);
    resultArea.classList.add("hidden");

    try {
        const res = await fetch(`${API_BASE}/predict-harvest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        const data = await res.json();

        if (!res.ok) {
            resultArea.innerHTML = `<div class="error-msg">${data.error || "Prediction failed."}</div>`;
            resultArea.classList.remove("hidden");
            return;
        }

        const w = data.recommended_window;
        const weather = data.weather;
        const reasons = data.reasons || [];
        const allWindows = data.all_windows || [];

        let reasonsHTML = reasons.map(r => `<li>${translateReason(r)}</li>`).join("");

        let otherWindowsHTML = "";
        if (allWindows.length > 1) {
            const chips = allWindows.slice(1).map(
                ow => `<span class="window-chip">${ow.start} → ${ow.end} (${ow.days} ${t("consecutive_days")})</span>`
            ).join("");
            otherWindowsHTML = `
                <div class="other-windows">
                    <h4>${t("other_windows")}</h4>
                    ${chips}
                </div>
            `;
        }

        resultArea.innerHTML = `
            <div class="result-window">
                <div class="window-header">${t("recommended_harvest")}</div>
                <div class="window-dates">${w.start} → ${w.end}</div>
                <div class="window-days">${w.days} ${t("consecutive_days")}</div>
                <div class="weather-stats">
                    <div class="weather-stat">
                        <span class="stat-label">${t("avg_temp")}</span>
                        <span class="stat-value">${weather.avg_temperature}°C</span>
                    </div>
                    <div class="weather-stat">
                        <span class="stat-label">${t("humidity")}</span>
                        <span class="stat-value">${weather.avg_humidity}%</span>
                    </div>
                    <div class="weather-stat">
                        <span class="stat-label">${t("precipitation")}</span>
                        <span class="stat-value">${weather.avg_precipitation} mm</span>
                    </div>
                    <div class="weather-stat">
                        <span class="stat-label">${t("cloud_cover")}</span>
                        <span class="stat-value">${weather.avg_cloud_cover}%</span>
                    </div>
                </div>
                <div style="margin-bottom:0.5rem;font-size:0.9rem;color:#88cc88;font-weight:500;">
                    ${t("why_suitable")}
                </div>
                <ul class="reasons-list">${reasonsHTML}</ul>
                ${otherWindowsHTML}
            </div>
        `;
        resultArea.classList.remove("hidden");
    } catch (err) {
        resultArea.innerHTML = `<div class="error-msg">${t("server_error")}</div>`;
        resultArea.classList.remove("hidden");
    } finally {
        toggleLoading(btn, false);
    }
}

/* =============================================================
   PRICE PREDICTION
   ============================================================= */

async function predictPrice() {
    const btn = document.getElementById("btn-price");
    const resultArea = document.getElementById("price-result");

    const district = document.getElementById("select-district").value;
    const commodity = document.getElementById("select-commodity").value;

    if (!district || !commodity) {
        resultArea.innerHTML = `<div class="error-msg">${t("select_both")}</div>`;
        resultArea.classList.remove("hidden");
        return;
    }

    toggleLoading(btn, true);
    resultArea.classList.add("hidden");

    try {
        const res = await fetch(`${API_BASE}/predict-price`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ district, commodity }),
        });
        const data = await res.json();

        if (!res.ok) {
            resultArea.innerHTML = `<div class="error-msg">${data.error || "Prediction failed."}</div>`;
            resultArea.classList.remove("hidden");
            return;
        }

        const predictions = data.predictions;
        const bestMarket = data.best_market;
        const bestPrice = data.best_price;

        let rows = "";
        for (const [market, price] of Object.entries(predictions)) {
            const isBest = market === bestMarket;
            rows += `
                <tr class="${isBest ? 'best-row' : ''}">
                    <td>${capitalize(market)}${isBest ? '<span class="best-badge">★ Best</span>' : ''}</td>
                    <td>₹${price.toLocaleString("en-IN")}</td>
                </tr>
            `;
        }

        resultArea.innerHTML = `
            <table class="price-results-table">
                <thead>
                    <tr>
                        <th>${t("market")}</th>
                        <th>${t("predicted_price")}</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="best-market-card">
                <div class="best-label">${t("best_market")}</div>
                <div class="best-name">${capitalize(bestMarket)}</div>
                <div class="best-price">₹${bestPrice.toLocaleString("en-IN")}</div>
                <div style="font-size:0.8rem;color:#88aa88;margin-top:0.3rem;">
                    ${t("predicted_for")} ${data.prediction_date}
                </div>
            </div>
        `;
        resultArea.classList.remove("hidden");
    } catch (err) {
        resultArea.innerHTML = `<div class="error-msg">${t("server_error")}</div>`;
        resultArea.classList.remove("hidden");
    } finally {
        toggleLoading(btn, false);
    }
}

/* =============================================================
   SPOILAGE PREDICTION
   ============================================================= */

async function loadSpoilageCommodities() {
    try {
        const res = await fetch(`${API_BASE}/spoilage-commodities`);
        const data = await res.json();
        const commodities = data.commodities || [];
        const select = document.getElementById("spoil-commodity");
        select.innerHTML = `<option value="">${t("select_commodity")}</option>`;
        for (const c of commodities) {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = capitalize(c);
            select.appendChild(opt);
        }
    } catch (err) {
        console.error("Failed to load spoilage commodities:", err);
    }
}

async function predictSpoilage() {
    const btn = document.getElementById("btn-spoilage");
    const resultArea = document.getElementById("spoilage-result");

    const commodity = document.getElementById("spoil-commodity").value;
    const storageDays = document.getElementById("spoil-days").value;
    const humidity = document.getElementById("spoil-humidity").value;

    if (!commodity) {
        resultArea.innerHTML = `<div class="error-msg">${t("select_commodity_first")}</div>`;
        resultArea.classList.remove("hidden");
        return;
    }

    toggleLoading(btn, true);
    resultArea.classList.add("hidden");

    try {
        const res = await fetch(`${API_BASE}/predict-spoilage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commodity, storage_days: storageDays, humidity }),
        });
        const data = await res.json();

        if (!res.ok) {
            resultArea.innerHTML = `<div class="error-msg">${data.error || "Prediction failed."}</div>`;
            resultArea.classList.remove("hidden");
            return;
        }

        const riskPercent = Math.round(data.spoilage_risk * 100);
        const riskClass = data.risk_level.toLowerCase();
        const reasons = data.reasons || [];

        const riskLabel = data.risk_level === "HIGH" ? t("risk_high")
            : data.risk_level === "MODERATE" ? t("risk_moderate")
                : t("risk_low");

        const reasonsHTML = reasons.map(r => `<li>${r}</li>`).join("");

        resultArea.innerHTML = `
            <div class="spoilage-gauge">
                <div class="risk-score ${riskClass}">${riskPercent}%</div>
                <div class="risk-badge ${riskClass}">${riskLabel}</div>
                <div style="margin-top:0.75rem;font-size:0.85rem;color:#88aa88;">
                    ${t("perishability_score")}: ${data.perishability_score}
                </div>
            </div>
            <div style="font-size:0.9rem;color:#88cc88;font-weight:500;margin-bottom:0.5rem;">
                ${t("contributing_factors")}:
            </div>
            <ul class="reasons-list">${reasonsHTML}</ul>
        `;
        resultArea.classList.remove("hidden");
    } catch (err) {
        resultArea.innerHTML = `<div class="error-msg">${t("server_error")}</div>`;
        resultArea.classList.remove("hidden");
    } finally {
        toggleLoading(btn, false);
    }
}

/* =============================================================
   SOCIAL MEDIA / COMMUNITY
   ============================================================= */

async function loadPosts() {
    const feed = document.getElementById("posts-feed");

    try {
        const res = await fetch(`${API_BASE}/posts`);
        const data = await res.json();
        const posts = data.posts || [];

        if (posts.length === 0) {
            feed.innerHTML = `
                <div class="no-posts-msg">
                    <p>${t("no_posts")}</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = posts.map(post => {
            const timeAgo = getTimeAgo(post.created_at);
            const imageHTML = post.image_url
                ? `<img src="${escapeHTML(post.image_url)}" alt="Post image" class="post-image" onerror="this.style.display='none'">`
                : "";

            return `
                <div class="post-item">
                    <div class="post-header">
                        <div class="post-avatar">👨‍🌾</div>
                        <div class="post-meta">
                            <div class="post-author">${escapeHTML(capitalize(post.farmer_name))}</div>
                            <div class="post-time">${timeAgo}</div>
                        </div>
                    </div>
                    <div class="post-content-text">${escapeHTML(post.content)}</div>
                    ${imageHTML}
                </div>
            `;
        }).join("");
    } catch (err) {
        feed.innerHTML = `<div class="no-posts-msg"><p>${t("server_error")}</p></div>`;
    }
}

async function createPost() {
    const contentEl = document.getElementById("post-content");
    const imageUrlEl = document.getElementById("post-image-url");
    const content = contentEl.value.trim();
    const imageUrl = imageUrlEl.value.trim();

    if (!content) return;
    if (!currentFarmer) return;

    const btn = document.querySelector(".btn-post");
    toggleLoading(btn, true);

    try {
        const res = await fetch(`${API_BASE}/posts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                farmer_id: currentFarmer.farmer_id,
                content,
                image_url: imageUrl,
            }),
        });

        if (res.ok) {
            contentEl.value = "";
            imageUrlEl.value = "";
            await loadPosts();
        }
    } catch (err) {
        console.error("Failed to create post:", err);
    } finally {
        toggleLoading(btn, false);
    }
}

/* =============================================================
   UTILITIES
   ============================================================= */

function toggleLoading(btn, loading) {
    const span = btn.querySelector("span:first-child");
    const loader = btn.querySelector(".btn-loader");
    if (loading) {
        if (span) span.classList.add("hidden");
        if (loader) loader.classList.remove("hidden");
        btn.disabled = true;
        btn.style.opacity = "0.7";
    } else {
        if (span) span.classList.remove("hidden");
        if (loader) loader.classList.add("hidden");
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}

function capitalize(str) {
    if (!str) return "";
    return str.replace(/\b\w/g, l => l.toUpperCase());
}

function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function getTimeAgo(isoString) {
    const now = new Date();
    const then = new Date(isoString);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
