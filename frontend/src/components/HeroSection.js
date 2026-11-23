"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://educational-course-recommendation-system.onrender.com";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The backend runs on Render's free tier, which sleeps when idle and can take
// up to a minute to wake. Retry for a while instead of failing on the first try.
const withRetry = async (request, attempts = 8, delayMs = 8000) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await request();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await sleep(delayMs);
    }
  }
};

const HeroSection = () => {
  const [courseNames, setCourseNames] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState("");

  useEffect(() => {
    fetchCourseNames();
  }, []);

  const fetchCourseNames = async () => {
    setStatus("loading");
    try {
      const response = await withRetry(() =>
        axios.get(`${API_URL}/`, { timeout: 60000 })
      );
      setCourseNames(response.data.course_names);
      setStatus("ready");
    } catch (error) {
      console.error("Error fetching course names:", error);
      setStatus("error");
    }
  };

  const handleRecommendations = async () => {
    if (!selectedCourse) {
      setRecError("Please select a course first.");
      return;
    }
    setRecError("");
    setRecLoading(true);
    setRecommendations([]);
    try {
      const response = await withRetry(
        () =>
          axios.post(
            `${API_URL}/recommend`,
            { course_name: selectedCourse },
            { timeout: 60000 }
          ),
        3,
        5000
      );
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecError("Could not get recommendations. Please try again.");
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-500 to-white flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-600">
          Course Recommendation System
        </h1>
        <div className="mb-4">
          <label
            htmlFor="courseSelect"
            className="block text-gray-700 font-bold mb-2"
          >
            Select a course:
          </label>
          {status === "loading" && (
            <p className="text-sm text-gray-600 mb-2">
              Loading courses... The server sleeps when idle, so the first load
              can take up to a minute.
            </p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-600 mb-2">
              Could not reach the server.{" "}
              <button onClick={fetchCourseNames} className="underline">
                Try again
              </button>
            </p>
          )}
          <div className="relative">
            <select
              id="courseSelect"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              disabled={status !== "ready"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-gray-800"
            >
              <option value="">Select a course</option>
              {courseNames.map((courseName) => (
                <option key={courseName} value={courseName}>
                  {courseName}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        <button
          onClick={handleRecommendations}
          disabled={status !== "ready" || recLoading}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors duration-300 disabled:opacity-50"
        >
          {recLoading ? "Finding similar courses..." : "Get Recommendations"}
        </button>
        {recError && <p className="text-sm text-red-600 mt-2">{recError}</p>}
        {recommendations.length > 0 && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-2 text-purple-600">
              Recommended Courses:
            </h2>
            <ul className="list-disc pl-4">
              {recommendations.map((course) => (
                <li key={course} className="text-gray-700">
                  {course}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSection;
