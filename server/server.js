require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");

const connectDB = require("./config/db");


const Transcription = require("./models/Transcription");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ MongoDB connect (ONLY ONE WAY)
const mongoose = require("mongoose");

// connectDB(); ❌ comment this

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("CONNECTED OK"))
  .catch(err => console.log("FAILED:", err.message));

// ✅ Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// OpenAI Setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Home Route
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

// Speech-to-Text Route
app.post("/transcribe", upload.single("audio"), async (req, res) => {

  console.log("Hit received");
  console.log("file:",req.file);
  try {
    // ✅ safety check
    if (!req.file) {
      return res.status(400).json({
        error: "No audio file uploaded",
      });
    }

    const audioPath = req.file.path;

    // OpenAI Whisper transcription
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });

    // Save to MongoDB
    await Transcription.create({
      text: transcription.text,
    });

    res.json({
      transcription: transcription.text,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// Get History
app.get("/transcriptions", async (req, res) => {
  try {
    const data = await Transcription.find().sort({ createdAt: -1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// Server Start
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});