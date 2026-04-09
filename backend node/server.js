const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // ✅ better than bodyParser

// Routes
app.use("/api/users", userRoutes);

// Test API (for browser)
app.get("/", (req, res) => {
    res.send("SkillSync Backend Running 🚀");
});

app.get("/api/test", (req, res) => {
    res.json({ message: "API working in browser ✅" });
});

// Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});