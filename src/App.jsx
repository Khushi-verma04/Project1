import { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);

  let mediaRecorder;
  let audioChunks = [];

  // 📁 File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("audio", file);

    const res = await fetch("http://localhost:5000/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setText(data.text);
  };

  // 🎤 Start Recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch("http://localhost:5000/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setText(data.text);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  // ⛔ Stop Recording
  const stopRecording = () => {
    mediaRecorder.stop();
    setRecording(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">

      <h1 className="text-3xl font-bold mb-6">
        🎤 Speech to Text App
      </h1>

      {/* 📁 Upload */}
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="mb-4"
      />

      {/* 🎤 Record */}
      {!recording ? (
        <button
          onClick={startRecording}
          className="bg-green-500 text-white px-4 py-2 rounded mb-2"
        >
          Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="bg-red-500 text-white px-4 py-2 rounded mb-2"
        >
          Stop Recording
        </button>
      )}

      {/* 📝 Output */}
      <div className="mt-6 bg-white p-4 rounded shadow w-full max-w-xl">
        <h2 className="font-semibold mb-2">Transcription:</h2>
        <p>{text}</p>
      </div>

    </div>
  );
}

export default App;