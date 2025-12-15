import { GoogleGenAI, Type } from "@google/genai";

// Configuration to increase the request body size limit if the environment supports it
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};

export default async function handler(request: any, response: any) {
  // 1. Securely retrieve the key from Vercel Environment Variables
  const apiKey = process.env.New_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.error("Server API Key missing. Checked New_API_KEY and API_KEY.");
    return response.status(500).json({ error: "Server API Key configuration missing." });
  }

  // 2. Parse the incoming request (Image + Mode)
  // Ensure request.body exists (Vercel should parse it for application/json)
  const body = request.body || {};
  const { mode, image, context } = body;

  if (!image) {
    console.error("Missing image in request body");
    return response.status(400).json({ error: "No image data provided. Image might be too large." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // --- MODE 1: TAG GENERATION ---
    if (mode === 'tags') {
      const { name, maker, category, description } = context || {};
      
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: image,
        },
      };

      const textPart = {
        text: `Analyze the item in the image. Based on its name ("${name}"), maker ("${maker}"), category ("${category}"), and description ("${description}"), suggest 5-10 relevant tags for categorizing it for resale in an online store. Focus on keywords customers would search for.`,
      };

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tags: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                  description: 'A category tag for the warehouse item.'
                }
              }
            },
            required: ['tags']
          },
        },
      });

      return response.status(200).json({ text: result.text });
    }

    // --- MODE 2: IDENTIFY ITEM ---
    else if (mode === 'identify') {
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: image,
        },
      };

      const prompt = `
        Act as a Forensic Resale Appraiser. Your goal is to identify this item with extreme precision, utilizing the Google Search tool.

        PHASE 1: FORENSIC SCAN (Internal Thought Process)
        1. OCR extraction: Read EVERY visible letter, number, brand name, or serial code on the object. 
           - If text is found (e.g. "Nike", "Pyrex 404", "Patagonia"), you MUST include it in your search query.
        2. Visual Profiling: If no text is visible, identify the EXACT visual features:
           - Shape (e.g. "trumpet vase", "chelsea boot")
           - Material/Texture (e.g. "hobnail glass", "suede", "cast iron")
           - Pattern/Era (e.g. "Art Deco", "Mid-Century Modern", "Floral Chintz")

        PHASE 2: TARGETED SEARCH
        - Execute a Google Search using the extracted text or specific visual profile.
        - Prioritize "Sold" listings on eBay, Poshmark, Mercari, or 1stDibs to find the exact used/vintage match.
        - Look for the specific model name or pattern name.

        PHASE 3: REPORT GENERATION (Strict JSON)
        - "name": The precise title (e.g. "Vintage Fenton Hobnail Milk Glass Vase 6-inch").
        - "maker": The brand or artist.
        - "description": A "Google Lens" style AI Overview. Write 3-4 professional sentences describing what the item is, its likely era/origin, and key value features. Do not use conversational filler.
        - "price": An estimated market value (number only) based on comparable sold listings.
        - "tags": 5-8 specific keywords (e.g. "vintage", "milk glass", "fenton", "decor").

        OUTPUT RULES:
        - Return ONLY raw JSON. No markdown blocks.
        - Escape all double quotes inside strings.
        
        JSON TEMPLATE:
        {
          "name": "String",
          "maker": "String",
          "description": "String",
          "category": "String (Home Goods|Apparel|Electronics|Collectibles|Other)",
          "condition": "String (Good|Vintage|New)",
          "tags": ["String"],
          "price": Number
        }
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      // Extract search links
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const searchLinks = chunks
            ?.map((chunk: any) => {
                if (chunk.web) {
                    return { title: chunk.web.title, url: chunk.web.uri };
                }
                return null;
            })
            .filter((link: any) => link !== null) || [];

      return response.status(200).json({ 
          text: result.text,
          searchLinks: searchLinks
      });
    }

    return response.status(400).json({ error: "Invalid mode specified." });

  } catch (error: any) {
    console.error("API Error encountered:", error);
    return response.status(500).json({ error: error.message || "Internal Server Error" });
  }
}