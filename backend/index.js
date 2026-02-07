const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // ✅ FIX

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

function connectDB() {
  db.connect(err => {
    if (err) {
      console.error("❌ DB connection failed. Retrying in 3s...", err.code);
      setTimeout(connectDB, 3000);
    } else {
      console.log("✅ Connected to MySQL");
    }
  });
}

connectDB();

/* ---------- GET USERS ---------- */
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users;", (err, results) => {
    if (err) {
      console.error("GET /users error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

/* ---------- POST USER ---------- */
app.post("/users", (req, res) => {
  const { name, email, age } = req.body;

  if (!name || !email || age === undefined) {
    return res.status(400).json({
      error: "name, email and age are required"
    });
  }

  if (!Number.isInteger(age) || age <= 0) {
    return res.status(400).json({
      error: "age must be a positive number"
    });
  }

  const sql = "INSERT INTO users (name, email, age) VALUES (?, ?, ?)";

  db.query(sql, [name, email, age], (err, result) => {
    if (err) {
      console.error("POST /users error:", err);
      return res.status(500).json({ error: "Insert failed" });
    }

    res.status(201).json({
      message: "User created successfully",
      userId: result.insertId
    });
  });
});

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
