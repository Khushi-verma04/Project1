import { useState, useEffect} from "react";
import axios from "axios";

function App() {

  const [text, setText] = useState("");
  const [history, setHistory] = useState([]);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  let mediaRecorder;
  let audioChunks = [];

  // 📁 File Upload
  const handleFileUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("audio", file);

    try {

      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/transcribe",
        formData
      );

      setText(res.data.transcription);
      setHistory((prev) => [...prev, res.data.transcription]);

    } catch (error) {

      console.log(error);
      alert("Error uploading file");

    } finally {

      setLoading(false);

    }
  };

  // 🎤 Start Recording
  const startRecording = async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    mediaRecorder = new MediaRecorder(stream);

    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {

      const audioBlob = new Blob(audioChunks, {
        type: "audio/webm",
      });

      const formData = new FormData();

      formData.append("audio", audioBlob, "recording.webm");

      try {

        setLoading(true);

        const res = await axios.post(
          "http://localhost:5000/transcribe",
          formData
        );

        setText(res.data.transcription);

      } catch (error) {

        console.log(error);
        alert("Recording upload failed");

      } finally {

        setLoading(false);

      }
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

      <h1 className="text-4xl font-bold text-blue-600 mb-6">
        🎤 Speech to Text App
      </h1>

      {/* 📁 Upload */}
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="mb-4 p-2 border rounded-lg bg-white shadow"
      />

      {/* 🎤 Record */}
      {!recording ? (

        <button
          onClick={startRecording}
         className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg mb-2 transition duration-300"
        >
          Start Recording
        </button>

      ) : (

        <button
          onClick={stopRecording}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg mb-2 transition duration-300"
        >
          Stop Recording
        </button>

      )}

      {/* ⏳ Loading */}
      {loading && (
        <p className="mt-4">Transcribing...</p>
      )}

      {/* 📝 Output */}
      <div className="mt-6 bg-white p-6 rounded-2xl shadow-lg w-full max-w-xl">

        <h2 className="text-2xl font-semibold mb-3 text-gray-700">
          Transcription:
        </h2>

        <p>{text}</p>

      </div>

      <div className="mt-6 w-full max-w-xl">

  <h2 className="text-2xl font-bold mb-4 text-gray-700">
    History
  </h2>

  {history.map((item, index) => (

    <div
      key={index}
      className="bg-white p-4 rounded-xl shadow-md mb-3"
    >
      {item}
    </div>

  ))}

  </div>

    </div>
  );
}

export default App;