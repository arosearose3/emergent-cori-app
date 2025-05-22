import { useState, useRef, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import axios from "axios";
import "./App.css";
// Import mock data
import { mockPeopleData } from "./mockData";

// Backend URL from environment variables
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState("");
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Speech recognition reference
  const recognitionRef = useRef(null);

  // Verify mock data is loaded correctly
  useEffect(() => {
    console.log("Mock data loaded:", mockPeopleData);
  }, []);
  
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
      
      console.log("Starting speech recognition...");
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join("");
        
        console.log("Transcript:", transcript);
        setText(transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };
      
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError(`Failed to start recording: ${err.message}`);
      setIsRecording(false);
    }
  };
  
  // Stop recording when button is released
  const stopRecording = async () => {
    console.log("Stopping recording, current text:", text);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    setIsRecording(false);
    
    // Use a fallback text if no speech was recognized
    const searchText = text || "fallback search query";
    
    try {
      console.log("Processing search with text:", searchText);
      setIsLoading(true);
      
      // Transform text to structured JSON
      const structuredData = {
        query: searchText,
        timestamp: new Date().toISOString(),
      };
      
      console.log("Structured data:", structuredData);
      
      // For testing: Use mock data instead of API call
      // In production, uncomment the API call and remove the mock data usage
      // const response = await axios.post(`${API}/search-people`, structuredData);
      // setPeople(response.data.people || []);
      
      // Simulate network delay
      console.log("Simulating API call with mock data...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Setting people with mock data:", mockPeopleData.people);
      setPeople(mockPeopleData.people);
    } catch (err) {
      console.error("API request failed:", err);
      setError(`API request failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Simulated button press for testing in browser
  const handleSimulateSearch = () => {
    const demoText = "Find software engineers in San Francisco";
    console.log("Simulating search with text:", demoText);
    setText(demoText);
    
    // Process the simulated search
    setIsLoading(true);
    setTimeout(() => {
      console.log("Setting people with mock data:", mockPeopleData.people);
      setPeople(mockPeopleData.people);
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">Voice Search</h1>
        {/* Testing button for browsers that don't support speech recognition */}
        <button 
          onClick={handleSimulateSearch}
          className="test-button"
        >
          Simulate Search (Test)
        </button>
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
          <p className="recognized-text">"{text}"</p>
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
