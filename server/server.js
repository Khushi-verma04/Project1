require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error:", err));

const app = express();

app.use(cors());

const PORT = 5000;

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Upload API
app.post("/upload", upload.single("audio"), (req, res) => {
  res.send("File Uploaded Successfully ✅");
});

// Test Route
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.post("/upload", upload.single("file"), (req, res) => {
  try {
    res.json({
      message: "File uploaded successfully",
      file: req.file,
    });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});