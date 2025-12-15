
// Removed GoogleGenAI import - Client side no longer talks to Google directly
// Removed getApiKey and HARDCODED_API_KEY logic

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix e.g. "data:image/jpeg;base64,"
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

export const generateTags = async (
  imageFile: File,
  name: string,
  maker: string,
  category: string,
  description: string
): Promise<string[]> => {
  try {
    const imageBase64 = await fileToBase64(imageFile);

    // Call our own secure server API instead of Google directly
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mode: 'tags',
            image: imageBase64,
            context: { name, maker, category, description }
        })
    });

    if (!response.ok) {
        // Handle non-JSON errors (like Vercel 500 pages)
        const text = await response.text();
        let errorMessage = `Server Error (${response.status})`;
        try {
            const json = JSON.parse(text);
            if (json.error) errorMessage = json.error;
        } catch (e) {
            console.error("Non-JSON error response:", text);
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    const responseText = data.text?.trim();

    let parsed: { tags?: string[] } = {};
    if (responseText) {
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON response from Server:", responseText, e);
        const fallbackTags = responseText.match(/"(.*?)"/g)?.map((t: string) => t.replace(/"/g, '')) || [];
        if (fallbackTags.length > 0) return fallbackTags;
        return [];
      }
    }
    
    if (parsed && Array.isArray(parsed.tags)) {
      return parsed.tags;
    }
    return [];

  } catch (error: any) {
    console.error("Error generating tags:", error);
    throw new Error(error?.message || "Failed to generate tags.");
  }
};

export interface AutoIdentifiedItem {
  name: string;
  maker: string;
  description: string;
  category: string;
  tags: string[];
  condition: string;
  price?: number;
  searchLinks?: { title: string; url: string }[];
}

export const identifyItem = async (imageFile: File): Promise<AutoIdentifiedItem> => {
  try {
    const imageBase64 = await fileToBase64(imageFile);

    // Call our own secure server API
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mode: 'identify',
            image: imageBase64
        })
    });

    if (!response.ok) {
        // Handle non-JSON errors (like Vercel 500 pages)
        const text = await response.text();
        let errorMessage = `Server Error (${response.status})`;
        try {
            const json = JSON.parse(text);
            if (json.error) errorMessage = json.error;
        } catch (e) {
            console.error("Non-JSON error response:", text);
        }
        throw new Error(errorMessage);
    }

    const apiResult = await response.json();
    const responseText = apiResult.text?.trim();
    
    if (!responseText) throw new Error("AI returned empty response.");

    console.log("AI Raw Response:", responseText);

    // Robust JSON Extraction
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("AI failed to generate a structured report.");
    }

    let jsonString = responseText.substring(jsonStart, jsonEnd + 1);
    jsonString = jsonString.replace(/[\n\r]/g, " ").replace(/,\s*}/g, "}");

    let data: AutoIdentifiedItem;
    try {
        data = JSON.parse(jsonString) as AutoIdentifiedItem;
    } catch (e) {
        console.error("JSON Parse Error:", e);
        try {
            const fixedJson = jsonString.replace(/(?<!\\)"/g, '\\"').replace(/\\"{/g, '{').replace(/}\\"/g, '}').replace(/\\":/g, '":').replace(/,\\"/g, ',"');
            data = JSON.parse(fixedJson);
        } catch (e2) {
             throw new Error("Failed to parse AI Overview.");
        }
    }

    // Attach the search links returned by the server
    if (apiResult.searchLinks) {
        data.searchLinks = apiResult.searchLinks;
    }

    return data;

  } catch (error: any) {
    console.error("Error identifying item:", error);
    throw new Error(error?.message || "Identification failed.");
  }
};
