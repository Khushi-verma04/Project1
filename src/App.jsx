import { useState } from "react";

function App() {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState("");

  let mediaRecorder;
  let audioChunks = [];

  // 🎤 Start recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");

      const response = await fetch("http://localhost:5000/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setText(data.text);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  // ⛔ Stop recording
  const stopRecording = () => {
    mediaRecorder.stop();
    setRecording(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Speech to Text 🎤</h1>

      {!recording ? (
        <button onClick={startRecording}>Start Recording</button>
      ) : (
        <button onClick={stopRecording}>Stop Recording</button>
      )}

      <h3>Output:</h3>
      <p>{text}</p>
    </div>
  );
}

export default App;