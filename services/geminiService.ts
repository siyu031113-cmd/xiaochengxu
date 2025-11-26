
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateJobDescription = async (title: string, requirements: string): Promise<string> => {
  try {
    const prompt = `
      You are a program coordinator for the Summer Work Travel (SWT) USA program.
      Write an exciting job description for a student summer job: "${title}".
      Context/Requirements: ${requirements}.
      
      Structure:
      1. Job Highlight (The vibe of the workplace)
      2. Duties & Responsibilities (Bullet points)
      3. Perks (Housing, cultural exchange activities, etc.)
      
      Tone: Energetic, adventurous, appealing to international university students. 
      Language: Simplified Chinese (zh-CN) with some English keywords for job titles.
      Keep it under 200 words. Markdown format.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || '';
  } catch (error) {
    console.error("Error generating job desc:", error);
    throw error;
  }
};

export const generateArticleContent = async (topic: string): Promise<string> => {
  // Existing function kept for compatibility if needed, though mostly unused in new App flow
    const prompt = `Write a WeChat Official Account article about: "${topic}". Language: Simplified Chinese.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || '';
};

export const generateArticleIdeas = async (topic: string): Promise<string[]> => {
    // Existing function kept for compatibility
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 5 titles about "${topic}". Language: Simplified Chinese.`,
      config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
    });
    return response.text ? JSON.parse(response.text) : [];
};

export const generateCoverImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A photorealistic, bright, sunny summer job scene suitable for a travel brochure: ${prompt}. High quality, 4k.` }]
      },
      config: {
        imageConfig: {
            aspectRatio: "4:3" // Better for card headers
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating cover image:", error);
    throw error;
  }
};
