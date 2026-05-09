// api/analyze.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userData, crushData, sharedData } = req.body;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620", // Nejlepší model pro kreativní psaní
      max_tokens: 1000,
      temperature: 0.8,
      system: `Jsi "CrushMeter AI" – brutálně upřímný, vtipný, lehce sarkastický a mystický vztahový analytik. 
      Tvým úkolem je rozebrat vztah dvou lidí na základě jejich dat. 
      Piš česky. Nebuď generický. Buď trefný, trochu "toxic" (ve smyslu pravdivosti, co bolí) a vyvolávej pocit "jak to sakra ta AI ví?".
      Výsledek vrať VŽDY jako JSON objekt s těmito klíči:
      {
        "compatibility": číslo 0-100,
        "chemistry": "krátká trefná fráze",
        "dynamics": "věta o tom, jak to mezi nimi pulsuje",
        "problem": "největší red flag nebo překážka",
        "secret_energy": "něco hlubokého, co si neříkají",
        "verdict": "krátká věta, kdo se zamiluje první a proč"
      }`,
      messages: [{ 
        role: "user", 
        content: `Analyzuj tento pár:
        TY: ${userData.name}, narozen ${userData.birth}, vibe: ${userData.vibe}.
        CRUSH: ${crushData.name}, narozen ${crushData.birth}, vibe: ${crushData.vibe}.
        STAV: ${sharedData.status}, píší si: ${sharedData.frequency}.
        STORKA/DETAILY: ${sharedData.story}`
      }],
    });

    // Claude vrací text, který musíme parsovat jako JSON
    const responseText = msg.content[0].text;
    res.status(200).json(JSON.parse(responseText));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI analýza selhala. Zkus to znovu.' });
  }
}