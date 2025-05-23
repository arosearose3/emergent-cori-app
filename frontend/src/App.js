import { useState, useRef, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { useSwipeable } from "react-swipeable";
import axios from "axios";
import "./App.css";
// Import mock data for fallback
import { mockPeopleData } from "./mockData";

// API endpoints
const COUNSELORS_API = "https://corisystem.org/coriapp/counselorsByAvailability";
const MESSAGE_API = "https://corisystem.org/coriapp/clientNoteToTherapist";

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
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [editableComplaint, setEditableComplaint] = useState("");
  const [messageStatus, setMessageStatus] = useState(null);
  
  // Initialize speech recognition on component mount
  useEffect(() => {
    const initSpeechRecognition = async () => {
      try {
        // Request permission for speech recognition
        await SpeechRecognition.requestPermission();
        
        // Check if speech recognition is available
        const available = await SpeechRecognition.available();
        
        if (available) {
          console.log("Speech recognition is available");
          setSpeechAvailable(true);
        } else {
          console.error("Speech recognition is not available on this device");
          setError("Speech recognition is not available on this device");
        }
      } catch (err) {
        console.error("Error initializing speech recognition:", err);
        setError(`Error initializing speech recognition: ${err.message}`);
      }
    };
    
    initSpeechRecognition();
  }, []);

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
  }, []);
  
  // Start recording when button is pressed
  const startRecording = useCallback(async () => {
    setIsRecording(true);
    setError(null);
    
    try {
      if (!speechAvailable) {
        throw new Error("Speech recognition is not available");
      }
      
      // Start the speech recognition
      console.log("Starting speech recognition with Capacitor plugin...");
      
      // Set up the listener for partial results
      SpeechRecognition.addListener('partialResults', (data) => {
        if (data.matches && data.matches.length > 0) {
          console.log("Partial results:", data.matches[0]);
          setText(data.matches[0]);
        }
      });
      
      // Start the speech recognition
      await SpeechRecognition.start({
        language: 'en-US',
        partialResults: true,
        popup: false,
      });
      
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError(`Failed to start recording: ${err.message}`);
      setIsRecording(false);
    }
  }, [speechAvailable]);
  
  // Stop recording when button is released (availability stage)
  const stopRecordingAvailability = useCallback(async () => {
    console.log("Stopping recording for availability");
    
    try {
      // Stop the speech recognition
      const result = await SpeechRecognition.stop();
      console.log("Speech recognition result:", result);
      
      // Remove listeners
      SpeechRecognition.removeAllListeners();
      
      setIsRecording(false);
      
      // Use the final results if available
      let availabilityText = text;
      if (result && result.matches && result.matches.length > 0) {
        availabilityText = result.matches[0];
        setText(availabilityText);
      }
      
      // Use a fallback text if no speech was recognized
      if (!availabilityText) {
        availabilityText = "No availability specified";
      }
      
      setAvailability(availabilityText);
      
      try {
        console.log("Processing search with text:", availabilityText);
        setIsLoading(true);
        
        try {
          // Call the external API to get counselors by availability
          const response = await axios.post(COUNSELORS_API, {
            availabilityText: availabilityText,
            userInfo: userInfo
          });
          
          console.log("API response:", response.data);
          
          if (response.data && Array.isArray(response.data)) {
            // Format the data to match our expected structure
            const formattedPeople = response.data.map((therapist, index) => ({
              id: therapist.id || index + 1,
              name: therapist.TherapistName || "Unknown",
              website: therapist.TherapistWebsite || "#",
              photo: `https://corisystem.org/coriapp/image?id=${therapist.id || index + 1}`,
              description: therapist.description || `Available during ${availabilityText}`
            }));
            
            setPeople(formattedPeople);
          } else {
            throw new Error("Invalid response format from API");
          }
        } catch (apiErr) {
          console.error("API call failed, using mock data:", apiErr);
          // Fallback to mock data in case of API failure
          setPeople(mockPeopleData.people);
        }
        
        // Move to the next stage (complaint)
        setAppStage("complaint");
        setText(""); // Clear text for next stage
      } catch (err) {
        console.error("API request failed:", err);
        setError(`API request failed: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error stopping speech recognition:", err);
      setError(`Error stopping speech recognition: ${err.message}`);
      setIsRecording(false);
    }
  }, [text, userInfo]);
  
  // Stop recording for complaint
  const stopRecordingComplaint = useCallback(async () => {
    console.log("Stopping recording for complaint");
    
    try {
      // Stop the speech recognition
      const result = await SpeechRecognition.stop();
      console.log("Speech recognition result:", result);
      
      // Remove listeners
      SpeechRecognition.removeAllListeners();
      
      setIsRecording(false);
      
      // Use the final results if available
      let complaintText = text;
      if (result && result.matches && result.matches.length > 0) {
        complaintText = result.matches[0];
        setText(complaintText);
      }
      
      // Use a fallback text if no speech was recognized
      if (!complaintText) {
        complaintText = "No complaint specified";
      }
      
      setComplaint(complaintText);
    } catch (err) {
      console.error("Error stopping speech recognition:", err);
      setError(`Error stopping speech recognition: ${err.message}`);
      setIsRecording(false);
    }
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
  
  // Handle long press on a counselor - show message preview
  const handleCounselorLongPress = useCallback((counselor) => {
    console.log("Long press detected for counselor:", counselor);
    setSelectedTherapist(counselor);
    setEditableComplaint(complaint);
    setShowMessagePreview(true);
    setMessageStatus(null);
  }, [complaint]);
  
  // Send message to therapist
  const sendMessageToTherapist = useCallback(async () => {
    if (!selectedTherapist) return;
    
    try {
      setIsLoading(true);
      
      // Prepare data for API call
      const requestData = {
        patientName: userInfo.name,
        patientEmail: userInfo.email,
        chiefComplaint: editableComplaint,
        therapistId: selectedTherapist.id,
        therapistName: selectedTherapist.name
      };
      
      console.log("Sending message to therapist:", requestData);
      
      try {
        // Call the external API to send message to therapist
        const response = await axios.post(MESSAGE_API, requestData);
        
        console.log("Message API response:", response.data);
        
        // Set success message
        setMessageStatus({
          success: true,
          message: response.data.message || "Message sent successfully!"
        });
        
        // Store the response for this counselor
        setResponses(prev => ({
          ...prev,
          [selectedTherapist.id]: response.data.message || "Message sent successfully!"
        }));
        
        // Close the preview after a delay
        setTimeout(() => {
          setShowMessagePreview(false);
        }, 3000);
      } catch (apiErr) {
        console.error("API call failed:", apiErr);
        
        // Set error message
        setMessageStatus({
          success: false,
          message: apiErr.response?.data?.error || "Failed to send message. Please try again."
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessageStatus({
        success: false,
        message: "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedTherapist, userInfo, editableComplaint]);
  
  // Cancel message preview
  const cancelMessagePreview = useCallback(() => {
    setShowMessagePreview(false);
    setSelectedTherapist(null);
    setEditableComplaint("");
    setMessageStatus(null);
  }, []);
  
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
          {person.website && (
            <a href={person.website} target="_blank" rel="noopener noreferrer" className="person-website">
              {person.website}
            </a>
          )}
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
  
  // Render the initial stage content
  const renderInitialStage = useCallback(() => {
    return (
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
        
        {text && (
          <div className="text-container">
            <p className="recognized-text">"{text}"</p>
          </div>
        )}
      </div>
    );
  }, [isRecording, text, startRecording, stopRecordingAvailability]);
  
  // Render the complaint stage content
  const renderComplaintStage = useCallback(() => {
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
        
        {/* Results section - only shown in complaint stage */}
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
      </>
    );
  }, [
    availability,
    isRecording,
    text,
    complaint,
    people,
    startRecording,
    stopRecordingComplaint,
    clearComplaint,
    PersonCard
  ]);
  
  // Render message preview modal
  const renderMessagePreview = useCallback(() => {
    if (!showMessagePreview || !selectedTherapist) return null;
    
    return (
      <div className="message-preview-overlay">
        <div className="message-preview-modal">
          <h2 className="message-preview-title">Message Preview</h2>
          
          <div className="message-preview-content">
            <div className="message-field">
              <label>To:</label>
              <span>{selectedTherapist.name}</span>
            </div>
            
            <div className="message-field">
              <label>From:</label>
              <span>{userInfo.name} ({userInfo.email})</span>
            </div>
            
            <div className="message-field">
              <label>Chief Complaint:</label>
              <textarea
                value={editableComplaint}
                onChange={(e) => setEditableComplaint(e.target.value)}
                className="complaint-textarea"
                placeholder="Enter your chief complaint here..."
              />
            </div>
          </div>
          
          {messageStatus && (
            <div className={`message-status ${messageStatus.success ? 'success' : 'error'}`}>
              {messageStatus.message}
            </div>
          )}
          
          <div className="message-preview-actions">
            <button 
              className="cancel-button"
              onClick={cancelMessagePreview}
              disabled={isLoading}
            >
              Cancel
            </button>
            
            <button 
              className="send-button"
              onClick={sendMessageToTherapist}
              disabled={isLoading || !editableComplaint.trim()}
            >
              {isLoading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      </div>
    );
  }, [
    showMessagePreview,
    selectedTherapist,
    userInfo,
    editableComplaint,
    messageStatus,
    isLoading,
    cancelMessagePreview,
    sendMessageToTherapist
  ]);
  
  return (
    <div className="app-container">
      {/* User info header */}
      <div className="user-info-header">
        <div className="user-info">
          <span className="user-name">{userInfo.name}</span>
          <span className="user-email">{userInfo.email}</span>
        </div>
        
        {/* Test button for demo purposes */}
        <button 
          onClick={handleSimulateSearch}
          className="test-button"
        >
          Simulate (Test)
        </button>
      </div>
      
      {/* Main content - conditionally rendered based on app stage */}
      {appStage === "initial" ? renderInitialStage() : renderComplaintStage()}
      
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
      
      {/* Message preview modal */}
      {renderMessagePreview()}
    </div>
  );
}

export default App;
