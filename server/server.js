require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Transcription = require("./models/Transcription");
require("dotenv").config();

mongoose.connect("mongodb://Khushiverma04:Khushi1234@ac-m3jpjux-shard-00-00.ek01jtn.mongodb.net:27017,ac-m3jpjux-shard-00-01.ek01jtn.mongodb.net:27017,ac-m3jpjux-shard-00-02.ek01jtn.mongodb.net:27017/?ssl=true&replicaSet=atlas-s8fkos-shard-0&authSource=admin&appName=Cluster0")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const app = express();
connectDB();
app.use(cors());

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

app.post("/transcribe", upload.single("audio"), async (req, res) => {

});


const PORT = 5000;

// Upload API
app.post("/upload", upload.single("audio"), (req, res) => {
  res.send("File Uploaded Successfully ✅");
});

// Test Route

app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

app.get("/transcriptions", async (req, res) => {
  try {
    const data = await Transcription.find().sort({
      createdAt: -1,
    });

    res.json(data);

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
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

app.listen(process.env.port, () => {
  console.log("server running on port",
    process.env.PORT);
});

// 🔑 OpenAI API key yahan paste karo
const openai = new OpenAI({
  apiKey: "sk-proj-RwhOpoMlcFj_AvobEDWASanpO",
});

// 🎤 Speech to Text API route
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const audioPath = req.file.path;

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });

    const savedText = await Transcription.create({
      text: transcription.text, 
    });

    res.json({
      text: transcription.text,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// 🚀 server start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const client = new OpenAI({
  apiKey: process.env.OpenAI_API_KEY,
});