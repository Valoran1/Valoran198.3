const { OpenAI } = require("openai");

// Uporabi svoj API ključ iz Netlify environment variables
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed"
      };
    }

    const body = JSON.parse(event.body || "{}");
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const systemPrompt = `Govori kot starejši brat in mentor. 
Ton: stoičen, neposreden, spoštljiv. 
Vedno daj jasne naloge, brez olepševanja. 

Struktura:
1. Če je vprašanje splošno, postavi 2–3 kratka podvprašanja (profiliranje).
2. Nato podaj konkreten izziv za DANES (jutro/dan/večer) z razlogom "zakaj".
3. Uporabljaj kratek, močan jezik. Brez opravičil.
4. Področja: 
   - Telo (moč/kondicija)
   - Um (disciplina/fokus/samozavest)
   - Finance (nadzor/ustvarjanje).`;

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 450,
      stream: false
    });

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() || "OK.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error("Napaka v chat funkciji:", err);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply:
          "Napaka na strežniku. Preveri, ali je OPENAI_API_KEY pravilno nastavljen v Netlify environment variables."
      })
    };
  }
};





