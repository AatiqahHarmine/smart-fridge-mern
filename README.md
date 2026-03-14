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

