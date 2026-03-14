# Smart Fridge — Full Stack MERN IoT Dashboard

> Research project: Low-Cost Smart Refrigerator with Predictive Spoilage Alerts  
> Asia Pacific University of Technology and Innovation

---

## Project Structure

```
smart-fridge/
├── backend/                  ← Node.js + Express + MongoDB
│   ├── config/
│   │   └── seed.js           ← Sample data seeder
│   ├── middleware/
│   │   └── auth.js           ← JWT middleware
│   ├── models/
│   │   ├── User.js           ← User schema
│   │   ├── SensorReading.js  ← DHT22, HX711, PIR, Ultrasonic
│   │   ├── FoodItem.js       ← Food inventory with expiry
│   │   └── Alert.js          ← IoT + AI alerts
│   ├── routes/
│   │   ├── auth.js           ← Register / Login / Me
│   │   ├── sensors.js        ← Sensor readings API
│   │   ├── food.js           ← CRUD food inventory
│   │   ├── alerts.js         ← Alerts management
│   │   └── dashboard.js      ← Summary endpoint
│   ├── .env.example
│   ├── package.json
│   └── server.js             ← Entry point
│
└── frontend/                 ← React + Vite
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx    ← Sidebar navigation
    │   │   └── Layout.module.css
    │   ├── context/
    │   │   └── AuthContext.jsx ← Global auth state
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── FoodPage.jsx
    │   │   ├── AlertsPage.jsx
    │   │   └── *.module.css
    │   ├── utils/
    │   │   └── api.js        ← Axios instance
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Prerequisites

Install these before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | https://nodejs.org |
| VS Code | Latest | https://code.visualstudio.com |
| Git | Latest | https://git-scm.com |
| MongoDB Atlas | Free | https://www.mongodb.com/atlas |

---

## Step 1 — MongoDB Atlas Setup

1. Go to https://www.mongodb.com/atlas and create a free account
2. Click **"Build a Database"** → choose **M0 Free Tier**
3. Choose region closest to you (e.g. Singapore AP-Southeast)
4. Create a **Database User**:
   - Username: `smartfridge_user`
   - Password: (save this!)
5. Under **Network Access** → click **"Add IP Address"** → **"Allow Access from Anywhere"** (0.0.0.0/0)
6. Click **Connect** → **"Connect your application"**
7. Copy the connection string, looks like:
   ```
   mongodb+srv://smartfridge_user:<password>@cluster0.xxxxx.mongodb.net/
   ```

---

## Step 2 — Open in VS Code

```bash
# Open the project folder in VS Code
code smart-fridge
```

**Recommended VS Code Extensions** (install from Extensions panel):
- **ES7+ React/Redux/React-Native snippets** — React shortcuts
- **Prettier** — Code formatter
- **MongoDB for VS Code** — Browse your database visually
- **Thunder Client** — Test your API endpoints
- **GitLens** — Git history

---

## Step 3 — Backend Setup

Open a **new terminal** in VS Code (`Ctrl+\`` or Terminal → New Terminal):

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy the environment file
cp .env.example .env
```

Now **open `.env`** in VS Code and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://smartfridge_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/smart_fridge?retryWrites=true&w=majority
JWT_SECRET=change_this_to_any_long_random_string_eg_abc123xyz789
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

> ⚠️ Replace `YOUR_PASSWORD` with your MongoDB Atlas password  
> ⚠️ Replace `cluster0.xxxxx` with your actual cluster URL

---

## Step 4 — Seed Sample Data

```bash
# Still inside backend/ folder
npm run seed
```

Expected output:
```
✅ Connected to MongoDB
✅ Demo user created: demo@smartfridge.com
✅ 24 sensor readings created
✅ Food items created: 8
✅ Sample alerts created

🎉 Seed complete!
Login: demo@smartfridge.com / demo1234
```

---

## Step 5 — Start the Backend

```bash
# Still inside backend/ folder
npm run dev
```

Expected output:
```
✅ Connected to MongoDB Atlas
🚀 Server running on port 5000
```

Test it works — open browser and visit:  
`http://localhost:5000/api/health`

You should see:
```json
{ "status": "OK", "message": "Smart Fridge API running" }
```

---

## Step 6 — Frontend Setup

Open a **second terminal** in VS Code:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in 300ms
  ➜  Local:   http://localhost:3000/
```

---

## Step 7 — Open the App

Visit **http://localhost:3000** in your browser.

You will see the **Login page**. Use the demo credentials:
- Email: `demo@smartfridge.com`
- Password: `demo1234`

Or click **"Create one"** to register a new account.

---

## API Endpoints Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/auth/me` | Get current user |

### Sensors (ESP32 → Server)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sensors/reading` | Save sensor data |
| GET | `/api/sensors/latest` | Latest reading |
| GET | `/api/sensors/history?hours=24` | History |
| GET | `/api/sensors/stats` | 24h averages |

### Food Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/food` | All active items |
| POST | `/api/food` | Add new item |
| PUT | `/api/food/:id` | Update item |
| DELETE | `/api/food/:id` | Remove item |
| GET | `/api/food/expiring?days=3` | Items expiring soon |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | All alerts |
| PUT | `/api/alerts/:id/read` | Mark one read |
| PUT | `/api/alerts/read-all` | Mark all read |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | All data combined |

---

## ESP32 Integration

To send real sensor data from your ESP32, use this Arduino code pattern:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_PC_IP:5000/api/sensors/reading";
const char* authToken = "Bearer YOUR_JWT_TOKEN_FROM_LOGIN";

void sendSensorData(float temp, float humidity, float weight, bool motion, float distTop, float distBottom) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", authToken);

  StaticJsonDocument<256> doc;
  doc["temperature"] = temp;
  doc["humidity"] = humidity;
  doc["weightTotal"] = weight;
  doc["motionDetected"] = motion;
  doc["distanceTop"] = distTop;
  doc["distanceBottom"] = distBottom;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.println("HTTP Response: " + String(code));
  http.end();
}
```

---

## Testing with Thunder Client (VS Code)

1. Install **Thunder Client** extension
2. Create a new request:
   - POST `http://localhost:5000/api/auth/login`
   - Body (JSON): `{ "email": "demo@smartfridge.com", "password": "demo1234" }`
3. Copy the `token` from the response
4. Test sensors endpoint:
   - POST `http://localhost:5000/api/sensors/reading`
   - Header: `Authorization: Bearer <YOUR_TOKEN>`
   - Body: `{ "temperature": 3.5, "humidity": 68, "weightTotal": 4.2, "motionDetected": false, "distanceTop": 28, "distanceBottom": 12 }`

---

## Run Both Servers Together

Create a root `package.json` to run both simultaneously:

```bash
# From the smart-fridge/ root folder
npm init -y
npm install concurrently --save-dev
```

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm run dev\""
  }
}
```

Then just run:
```bash
npm run dev
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` on MongoDB | Check your `.env` MONGODB_URI and Atlas Network Access whitelist |
| `401 Unauthorized` on API | Token expired — re-login to get a new token |
| Frontend shows blank | Make sure backend is running on port 5000 |
| `npm install` fails | Ensure Node.js v18+ is installed: `node --version` |
| CORS error | Check that `http://localhost:3000` is in backend cors config |

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| MCU | ESP32 (Wi-Fi, dual-core) |
| Sensors | DHT22, HX711, HC-SR501, HC-SR04 |
| Protocol | MQTT (EMQX broker) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (NoSQL) |
| Frontend | React 18, Vite, Chart.js |
| Auth | JWT (JSON Web Tokens) |
| AI | Gemini AI API (spoilage analysis) |
| IoT Platform | Node-RED |
| Dev Method | Agile |
