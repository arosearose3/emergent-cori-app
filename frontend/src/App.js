import { useState, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import axios from "axios";
import "./App.css";

// Backend URL from environment variables
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState("");
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Speech recognition reference
  const recognitionRef = useRef(null);
  
  // Start recording when button is pressed
  const startRecording = () => {
    setIsRecording(true);
    setText("");
    setError(null);
    
    try {
      // Check if SpeechRecognition is available
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser.");
      }
      
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join("");
        
        setText(transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };
      
      recognitionRef.current.start();
    } catch (err) {
      setError(`Failed to start recording: ${err.message}`);
      setIsRecording(false);
    }
  };
  
  // Stop recording when button is released
  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    setIsRecording(false);
    
    if (text) {
      try {
        setIsLoading(true);
        
        // Transform text to structured JSON
        const structuredData = {
          query: text,
          timestamp: new Date().toISOString(),
          // Add any additional data structure needed by your API
        };
        
        // Send to API
        const response = await axios.post(`${API}/search-people`, structuredData);
        
        // Update people state with API response
        setPeople(response.data.people || []);
      } catch (err) {
        setError(`API request failed: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">Voice Search</h1>
      </div>
      
      <div className="button-container">
        <button
          className={`talk-button ${isRecording ? 'recording' : ''}`}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
        >
          {isRecording ? "Release to Search" : "Press To Talk"}
        </button>
      </div>
      
      {text && (
        <div className="text-container">
          <p className="recognized-text">{text}</p>
        </div>
      )}
      
      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Processing your request...</p>
        </div>
      )}
      
      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      )}
      
      {people.length > 0 && (
        <div className="results-container">
          <h2 className="results-title">Results</h2>
          <div className="people-list">
            {people.map((person, index) => (
              <div key={index} className="person-card">
                <div className="person-image">
                  <img src={person.photo} alt={person.name} />
                </div>
                <div className="person-details">
                  <h3 className="person-name">{person.name}</h3>
                  <p className="person-description">{person.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
