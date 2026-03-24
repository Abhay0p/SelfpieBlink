import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const maxRequestsPerMinute = 5;
let requestCount = 0;
let lastReset = Date.now();

export const matchListWithAI = async (imageBuffer, inventory, mimeType = 'image/jpeg') => {
  // Rate limiter check
  if (Date.now() - lastReset > 60000) {
    requestCount = 0;
    lastReset = Date.now();
  }
  if (requestCount >= maxRequestsPerMinute) {
    throw new Error('Rate limit exceeded. Try again later.');
  }
  requestCount++;

  // Mock Gemini Response if API key is demo
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    console.log('Using simulated AI matching (No real API key)');
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Provide a mocked parsed list corresponding to the inventory
    return [
      { matchedId: '1', name: 'Amul Milk 500ml', requestedQuantity: 2, price: 30 },
      { matchedId: '4', name: 'Maggi Noodles', requestedQuantity: 5, price: 14 }
    ];
  }

  // Actual Gemini API Integration
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const mappedInventory = inventory.map(i => ({ id: i._id, name: i.name, stock: i.stock, price: i.price }));
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        `You are a brilliant multi-lingual grocery store AI assistant. An imperfect human has uploaded a picture of their handwritten shopping list. 
         The handwriting might be incredibly messy, cursive, scribbled, and written in multiple languages (English, Hindi, Hinglish slangs like "Aata", "Chawal", "Doodh", etc.).
         
         Here is the EXACT JSON live inventory catalog of the Store they are standing in right now:
         ${JSON.stringify(mappedInventory)}
         
         YOUR DIRECTIVES:
         1. Read their messy list carefully. Translate any Hindi/Hinglish terms to English if necessary to find a match (e.g. "Doodh" -> "Milk").
         2. Handle spelling mistakes gracefully (e.g. "Magi" -> "Maggi", "Biskut" -> "Biscuit").
         3. Match what they wrote ONLY to the items available in the catalog JSON provided above.
         4. If they requested an item that exists in the catalog, extract its exact "id", "name", "price".
         5. Determine the requested quantity (Default to 1 if not specified).
         
         OUTPUT FORMAT:
         Return an incredibly strict, pure JSON Array containing ONLY objects with:
         { "matchedId": "id_from_catalog", "name": "name_from_catalog", "requestedQuantity": number, "price": number }
         
         DO NOT include items that don't match or aren't in the provided catalog.
         DO NOT return markdown code blocks (like \`\`\`json). Return JUST the raw literal JSON array.`,
        { inlineData: { data: imageBuffer.toString('base64'), mimeType: mimeType } }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Gemini processing failed:', error);
    // Silent fallback to empty array or throw error
    throw new Error('Could not parse handwritten list');
  }
};
