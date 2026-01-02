
import { GoogleGenAI, Type } from "@google/genai";
import { Trip } from "../types";

// Initialize the GoogleGenAI client using the API_KEY from the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTripSummary = async (trip: Trip): Promise<string> => {
  try {
    const prompt = `Analyze this GPS trip data and provide a concise, friendly summary (2 sentences max). 
    Distance: ${trip.distance.toFixed(2)} km, 
    Duration: ${trip.startTime} to ${trip.endTime}, 
    Avg Speed: ${trip.avgSpeed.toFixed(1)} km/h. 
    Mention if it was likely a walk, run, or drive and provide one health or efficiency tip.`;

    // Use ai.models.generateContent with model and contents properties.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Extract the text output using the .text property.
    return response.text || "No summary available for this trip.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate AI summary at this time.";
  }
};
