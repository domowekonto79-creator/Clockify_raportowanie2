import { GoogleGenAI } from "@google/genai";

export const summarizeDailyTasks = async (
  apiKey: string,
  date: string,
  descriptions: string[]
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Brak klucza API Gemini");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Filter out empty descriptions and distinct them
  const uniqueDescriptions = Array.from(new Set(descriptions.filter(d => !!d)));
  
  if (uniqueDescriptions.length === 0) return "Brak opisu.";

  const prompt = `
    Jesteś profesjonalnym asystentem biurowym.
    Twoim zadaniem jest podsumowanie listy zadań wykonanych w dniu ${date} w jedno spójne, profesjonalne zdanie lub krótki akapit w języku polskim.
    Styl ma być formalny, pasujący do "Zestawienia czynności wykonanych w miesiącu" dla korporacji (branża IT/Telekomunikacja/HR).
    Unikaj punktorów. Połącz powiązane zadania.
    
    Lista zadań:
    ${uniqueDescriptions.map(d => `- ${d}`).join('\n')}
    
    Przykładowy oczekiwany styl:
    "Tworzenie templatów do realizacji zadań, rozpoczęcie kompletowania dokumentacji pod filar zarządzania ryzykiem ICT oraz spotkanie z zespołem w sprawie migracji."
    
    Tylko treść podsumowania, bez dodatkowego komentarza.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || uniqueDescriptions.join(", ");
  } catch (error) {
    console.error("Gemini summarization error:", error);
    return uniqueDescriptions.join(", ");
  }
};