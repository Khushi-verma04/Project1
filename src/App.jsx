import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { supabase } from "./supabaseClient";

function App() {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [recording, setRecording] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);

  // ✅ FIX 1: missing file state added
  const [file, setFile] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ---------------- AUTH ----------------
  const signUpUser = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) alert(error.message);
    else alert("Signup successful");
  };

  const loginUser = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Login successful");
      setUser(data.user);
    }
  };

  const logoutUser = async () => {
    await supabase.auth.signOut();
    setUser(null);
    alert("Logged out");
  };

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUser(data.user);
  };

  useEffect(() => {
    checkUser();
  }, []);

  // ---------------- SAVE TO SUPABASE ----------------
  const saveTranscription = async (transcribedText) => {
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;

    if (!currentUser) return;

    const { error } = await supabase.from("transcriptions").insert([
      {
        user_id: currentUser.id,
        text: transcribedText,
      },
    ]);

    if (error) {
      console.log("DB Error:", error.message);
    }
  };

  // ---------------- FIX 2: file handler added ----------------
  const handleFileUpload = async (e) => {
    // ✅ FIXED: [0] lagana zaroori hai taaki select ki gayi pehli file nikal sake
    const selectedFile = e.target.files[0]; 

    if (!selectedFile) {
      setError("Pehle file select karo!");
      return;
    }

    setFile(selectedFile); // state update
    setError("");
  };

  // ✅ FIX 3: Button ke liye upload execute karne wala missing function add kiya
  const handleUploadSubmit = async () => {
    if (!file) {
      setError("Pehle file select karo!");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("audio", file, file.name);

    try {
      const res = await axios.post(
        "http://localhost:5000/transcribe",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // ✅ FIXED: res.data.message ki jagah res.data.text se asli text nikalna
      const actualText = res.data.text || "No text generated";
      setText(actualText);
      saveTranscription(actualText);
      setHistory((prev) => [actualText, ...prev]);
    } catch (err) {
      console.error("FULL ERROR:", err.response?.data || err.message);
      setError("Upload fail ho gaya!");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RECORDING ----------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const formData = new FormData();
        // ✅ FIXED: Multer error se bachne ke liye dono jagah key 'audio' rakhi hai
        formData.append("audio", audioBlob, "recording.webm");

        try {
          setLoading(true);

          const res = await axios.post(
            "http://localhost:5000/transcribe",
            formData
          );

          // ✅ FIXED: res.data.message ki jagah res.data.text se asli text nikalna
          const actualText = res.data.text || "No text generated";
          setText(actualText);
          setHistory((prev) => [actualText, ...prev]);
          saveTranscription(actualText);
        } catch (error) {
          console.log(error);
          setError("Recording upload failed");
        } finally {
          setLoading(false);
        }

        streamRef.current?.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.log(err);
      setError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">

      {/* AUTH */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6 w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-4">Authentication</h2>

        <input
          type="email"
          placeholder="Enter Email"
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded w-full mb-3"
        />

        <input
          type="password"
          placeholder="Enter Password"
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded w-full mb-3"
        />

        <button
          onClick={signUpUser}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Sign Up
        </button>

        <button
          onClick={loginUser}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Login
        </button>
      </div>

      {user && (
        <button
          onClick={logoutUser}
          className="bg-red-500 text-white px-4 py-2 rounded mb-4"
        >
          Logout
        </button>
      )}

      <h1 className="text-4xl font-bold text-blue-600 mb-6">
        🎤 Speech to Text App
      </h1>

      {/* FILE UPLOAD */}
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="mb-4 p-2 border rounded-lg bg-white shadow"
      />

      {/* UPLOAD BUTTON */}
      <button
        onClick={handleUploadSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg mb-2"
      >
        Upload
      </button>

      {/* RECORD BUTTON */}
      {!recording ? (
        <button
          onClick={startRecording}
          className="bg-green-500 text-white px-4 py-2 rounded-lg mb-2"
        >
          Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="bg-red-500 text-white px-4 py-2 rounded-lg mb-2"
        >
          Stop Recording
        </button>
      )}

      {/* LOADING */}
      {loading && <p className="text-blue-600">Processing...</p>}

      {/* ERROR */}
      {error && <p className="text-red-600">{error}</p>}

      {/* OUTPUT */}
      <div className="mt-6 bg-white p-6 rounded-2xl shadow-lg w-full max-w-xl">
        <h2 className="text-2xl font-semibold mb-3">Transcription:</h2>
        <p>{text || "No transcription yet..."}</p>
      </div>

      {/* HISTORY */}
      <div className="mt-6 w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-4">History</h2>

        {history.length === 0 ? (
          <p>No history yet...</p>
        ) : (
          history.map((item, index) => (
            <div key={index} className="bg-white p-3 mb-2 rounded shadow">
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;