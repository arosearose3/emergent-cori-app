import { useState, useRef, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";
import { useSwipeable } from "react-swipeable";
import axios from "axios";
import "./App.css";
// Import mock data
import { mockPeopleData } from "./mockData";

// Backend URL from environment variables
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

function App() {
  // App state
  const [appStage, setAppStage] = useState("initial"); // initial, availability, complaint
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState("");
  const [availability, setAvailability] = useState("");
  const [complaint, setComplaint] = useState("");
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [responses, setResponses] = useState({});
  
  // Speech recognition reference
  const recognitionRef = useRef(null);

  // Get device info on component mount
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        // In a real app, you would get this from the device or account system
        // For this demo, we'll use mock data
        
        // Uncomment for real implementation with Capacitor Device API:
        // const deviceInfo = await Device.getInfo();
        // const deviceId = deviceInfo.uuid;
        
        // For demonstration purposes:
        setUserInfo({
          name: "John Doe",
          email: "johndoe@example.com"
        });
      } catch (err) {
        console.error("Error getting user info:", err);
      }
    };
    
    getUserInfo();
    console.log("Mock data loaded:", mockPeopleData);
  }, []);
  
  // Start recording when button is pressed
  const startRecording = useCallback(() => {
    setIsRecording(true);
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
  }, []);
  
  // Stop recording when button is released (availability stage)
  const stopRecordingAvailability = useCallback(async () => {
    console.log("Stopping recording for availability, current text:", text);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    setIsRecording(false);
    
    // Use a fallback text if no speech was recognized
    const availabilityText = text || "No availability specified";
    setAvailability(availabilityText);
    
    try {
      console.log("Processing search with text:", availabilityText);
      setIsLoading(true);
      
      // Transform text to structured JSON
      const structuredData = {
        query: availabilityText,
        timestamp: new Date().toISOString(),
        userInfo: userInfo
      };
      
      console.log("Structured data:", structuredData);
      
      // For testing: Use mock data instead of API call
      // In production, uncomment the API call and remove the mock data usage
      // const response = await axios.post(`${API}/search-counselors`, structuredData);
      // setPeople(response.data.people || []);
      
      // Simulate network delay
      console.log("Simulating API call with mock data...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the people with mock data (would be counselors from the API)
      console.log("Setting people with mock data:", mockPeopleData.people);
      setPeople(mockPeopleData.people);
      
      // Move to the next stage (complaint)
      setAppStage("complaint");
      setText(""); // Clear text for next stage
    } catch (err) {
      console.error("API request failed:", err);
      setError(`API request failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [text, userInfo]);
  
  // Stop recording for complaint
  const stopRecordingComplaint = useCallback(() => {
    console.log("Stopping recording for complaint, current text:", text);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    setIsRecording(false);
    setComplaint(text || "No complaint specified");
  }, [text]);
  
  // Confirm complaint
  const confirmComplaint = useCallback(() => {
    console.log("Complaint confirmed:", complaint);
  }, [complaint]);
  
  // Clear complaint and start over
  const clearComplaint = useCallback(() => {
    setComplaint("");
    setText("");
  }, []);
  
  // Remove a person from the list
  const removePerson = useCallback((personId) => {
    setPeople(prevPeople => prevPeople.filter(person => person.id !== personId));
  }, []);
  
  // Handle long press on a counselor
  const handleCounselorLongPress = useCallback(async (counselor) => {
    try {
      setIsLoading(true);
      
      // Prepare data for API call
      const requestData = {
        patientName: userInfo.name,
        patientEmail: userInfo.email,
        chiefComplaint: complaint,
        therapistId: counselor.id
      };
      
      console.log("Sending request to reach out:", requestData);
      
      // Simulate API call
      // In production, use a real API call:
      // const response = await axios.post(`${API}/reach-out`, requestData);
      // const responseText = response.data.message;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const responseText = `Thank you for reaching out to ${counselor.name}. They will contact you at ${userInfo.email} within 24 hours to discuss your appointment options.`;
      
      // Store the response for this counselor
      setResponses(prev => ({
        ...prev,
        [counselor.id]: responseText
      }));
    } catch (err) {
      console.error("Failed to reach out:", err);
      setError(`Failed to reach out: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [userInfo, complaint]);
  
  // Simulated button press for testing in browser
  const handleSimulateSearch = useCallback(() => {
    const demoText = "I'm available Tuesdays after 4pm and Thursday mornings";
    console.log("Simulating search with text:", demoText);
    setText(demoText);
    setAvailability(demoText);
    
    // Process the simulated search
    setIsLoading(true);
    setTimeout(() => {
      console.log("Setting people with mock data:", mockPeopleData.people);
      setPeople(mockPeopleData.people);
      setAppStage("complaint");
      setIsLoading(false);
    }, 1000);
  }, []);
  
  // Create a reusable person card component
  const PersonCard = useCallback(({ person }) => {
    const swipeHandlers = useSwipeable({
      onSwipedLeft: () => removePerson(person.id),
      onSwipedRight: () => removePerson(person.id),
      preventDefaultTouchmoveEvent: true,
      trackMouse: true
    });
    
    // Create a ref for long press detection
    const pressTimer = useRef(null);
    const startPress = () => {
      pressTimer.current = setTimeout(() => {
        handleCounselorLongPress(person);
      }, 800); // 800ms for long press
    };
    const endPress = () => {
      clearTimeout(pressTimer.current);
    };
    
    return (
      <div 
        key={person.id} 
        className="person-card"
        {...swipeHandlers}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
      >
        <div className="swipe-instruction">Swipe left or right to remove</div>
        <div className="person-image">
          <img src={person.photo} alt={person.name} />
        </div>
        <div className="person-details">
          <h3 className="person-name">{person.name}</h3>
          <p className="person-description">{person.description}</p>
          
          {responses[person.id] && (
            <div className="response-message">
              {responses[person.id]}
            </div>
          )}
        </div>
      </div>
    );
  }, [removePerson, handleCounselorLongPress, responses]);
  
  // Render the main content based on app stage
  const renderMainContent = useCallback(() => {
    switch (appStage) {
      case "initial":
        return (
          <>
            <div className="button-container">
              <button
                className={`talk-button ${isRecording ? 'recording' : ''}`}
                onMouseDown={startRecording}
                onMouseUp={stopRecordingAvailability}
                onTouchStart={startRecording}
                onTouchEnd={stopRecordingAvailability}
              >
                {isRecording 
                  ? "Release when done" 
                  : "Press to talk. Say when you are available for an appointment, like 'Tuesdays after 4'"}
              </button>
            </div>
            
            {text && (
              <div className="text-container">
                <p className="recognized-text">"{text}"</p>
              </div>
            )}
          </>
        );
        
      case "complaint":
        return (
          <>
            {availability && (
              <div className="availability-container">
                <h3>Your Availability:</h3>
                <p>{availability}</p>
              </div>
            )}
            
            <div className="button-container">
              <button
                className={`complaint-button ${isRecording ? 'recording' : ''}`}
                onMouseDown={startRecording}
                onMouseUp={stopRecordingComplaint}
                onTouchStart={startRecording}
                onTouchEnd={stopRecordingComplaint}
              >
                {isRecording ? "Release when done" : "Say your chief complaint"}
              </button>
            </div>
            
            {text && !complaint && (
              <div className="text-container">
                <p className="recognized-text">"{text}"</p>
                <div className="text-actions">
                  <button 
                    className="confirm-button"
                    onClick={() => setComplaint(text)}
                  >
                    Confirm
                  </button>
                  <button 
                    className="erase-button"
                    onClick={() => setText("")}
                  >
                    Erase
                  </button>
                </div>
              </div>
            )}
            
            {complaint && (
              <div className="complaint-container">
                <h3>Your Chief Complaint:</h3>
                <p>{complaint}</p>
                <button 
                  className="edit-button"
                  onClick={clearComplaint}
                >
                  Edit
                </button>
              </div>
            )}
          </>
        );
        
      default:
        return null;
    }
  }, [
    appStage, 
    isRecording, 
    text, 
    availability, 
    complaint, 
    startRecording, 
    stopRecordingAvailability, 
    stopRecordingComplaint, 
    clearComplaint
  ]);
  
  return (
    <div className="app-container">
      {/* User info header */}
      <div className="user-info-header">
        <div className="user-info">
          <span className="user-name">{userInfo.name}</span>
          <span className="user-email">{userInfo.email}</span>
        </div>
      </div>
      
      <div className="header">
        <h1 className="title">Therapist Finder</h1>
        {/* Testing button for browsers */}
        <button 
          onClick={handleSimulateSearch}
          className="test-button"
        >
          Simulate Availability (Test)
        </button>
      </div>
      
      {/* Main content area */}
      {renderMainContent()}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Processing your request...</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      )}
      
      {/* Results section */}
      {people.length > 0 && (
        <div className="results-container">
          <h2 className="results-title">Available Counselors</h2>
          <p className="long-press-instruction">Long Press a counselor to reach out.</p>
          <div className="people-list">
            {people.map(person => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
