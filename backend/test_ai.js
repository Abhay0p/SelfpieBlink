import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        "Return a JSON array with one object {" + '"test": "yes"' + "}.",
      ],
      config: {
        responseMimeType: "application/json",
      }
    });
    console.log("Response text:", response.text);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
