import React, { useState, useRef, useEffect } from "react";

const ChatGPTClone = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to the Package Tracking Assistant. Please provide a tracking number or ask a question about tracking a package.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // API endpoint
  const API_BASE_URL = "http://localhost:5000";

  // Function to send message to API
  const sendMessageToAPI = async (message) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: message }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      // Store structured tracking data
      if (data.structured_response) {
        setTrackingData(data.structured_response);
      }

      return data.raw_response;
    } catch (error) {
      console.error("Error sending message to API:", error);
      return "Sorry, there was an error processing your request. Please try again later.";
    }
  };

  // Direct tracking number lookup
  const trackByNumber = async (trackingNumber) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/track/${trackingNumber}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Server error");
      }
      console.log("Working Fine");

      const data = await response.json();

      // Store structured tracking data
      if (data.structured_response) {
        setTrackingData(data.structured_response);
      }

      return data.raw_response;
    } catch (error) {
      console.error("Error tracking by number:", error);
      return "Sorry, there was an error retrieving tracking information. Please try again later.";
    }
  };

  // Display tracking details component
  const TrackingDetails = ({ data }) => {
    if (!data) return null;

    return (
      <div className="bg-gray-800 rounded-lg p-4 mt-4 text-sm">
        <h3 className="font-bold text-blue-400 mb-2">Package Details</h3>

        <div className="mb-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Tracking Number:</span>
            <span className="font-mono">{data.tracking_number || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Carrier:</span>
            <span>{data.carrier.full_name || data.carrier.name || "N/A"}</span>
          </div>
        </div>

        <div className="mb-3">
          <h4 className="font-semibold text-gray-300 mb-1">Current Status</h4>
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className="font-semibold text-green-400">
              {data.status.current || "Unknown"}
            </span>
          </div>
          {data.status.timestamp && (
            <div className="flex justify-between">
              <span className="text-gray-400">Time:</span>
              <span>{new Date(data.status.timestamp).toLocaleString()}</span>
            </div>
          )}
          {data.status.location && (
            <div className="flex justify-between">
              <span className="text-gray-400">Location:</span>
              <span>{data.status.location}</span>
            </div>
          )}
        </div>

        {(data.delivery.estimated_date || data.delivery.delivered_date) && (
          <div className="mb-3">
            <h4 className="font-semibold text-gray-300 mb-1">
              Delivery Information
            </h4>
            {data.delivery.delivered_date && (
              <div className="flex justify-between">
                <span className="text-gray-400">Delivered:</span>
                <span>
                  {new Date(data.delivery.delivered_date).toLocaleString()}
                </span>
              </div>
            )}
            {data.delivery.estimated_date && (
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Delivery:</span>
                <span>
                  {new Date(data.delivery.estimated_date).toLocaleString()}
                </span>
              </div>
            )}
            {data.delivery.location && (
              <div className="flex justify-between">
                <span className="text-gray-400">Delivery Location:</span>
                <span>{data.delivery.location}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    // Add user message to chat
    const userMessage = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Reset tracking data for new query
    setTrackingData(null);

    // Check if the input is just a tracking number (simple validation)
    const isTrackingNumber = /^\d{6,}$/.test(inputValue.trim());

    let responseText;
    try {
      if (isTrackingNumber) {
        // If it looks like just a tracking number, use the direct endpoint
        responseText = await trackByNumber(inputValue.trim());
      } else {
        // Otherwise use the natural language endpoint
        responseText = await sendMessageToAPI(inputValue);
      }
    } catch (error) {
      responseText =
        "Sorry, there was an error processing your request. Please try again later.";
    }

    // Add assistant response
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: responseText },
    ]);
    setIsTyping(false);
  };

  // Handle enter key press to send message
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, trackingData]);

  // Focus input on component load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Check API health on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (!response.ok) {
          console.warn("API health check failed");
        }
      } catch (error) {
        console.error("API health check failed:", error);
      }
    };

    checkApiHealth();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded hover:bg-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button className="p-2 rounded hover:bg-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
        <div className="flex-1 text-center">
          <span className="font-medium">Package Tracker</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 inline-block ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-3xl p-3 rounded-lg ${
                message.role === "user" ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              <p>{message.content}</p>
            </div>
          </div>
        ))}

        {/* Display structured tracking data if available */}
        {trackingData && messages.length > 1 && (
          <div className="flex justify-start w-full">
            <div className="max-w-3xl w-full">
              <TrackingDetails data={trackingData} />
            </div>
          </div>
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-3xl p-3 rounded-lg bg-gray-700">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-500"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4">
        <div className="flex items-center relative">
          <button className="absolute left-4 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            className="w-full bg-gray-700 rounded-lg py-3 px-12 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter tracking number or ask a question..."
            rows="1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="absolute right-4 text-gray-400 hover:text-white"
            onClick={handleSendMessage}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="flex justify-center mt-2 space-x-2"></div>
      </div>
    </div>
  );
};

export default ChatGPTClone;
