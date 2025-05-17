const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();
const PORT = 3000;
const GEMINI_API_KEY = 'Your-Gemini-API-Key';

app.use(express.static(__dirname + '/..'));
app.use(bodyParser.json());

// ...existing code...
app.post('/api/question', async (req, res) => {
  try {
    const { topic, description, difficulty } = req.body;
    const prompt = `Generate a single MCQ with 1 question and 4 one-word options for topic: ${topic}. Difficulty: ${difficulty}. ${description ? 'Focus on: ' + description : ''}. Respond in JSON with {"question":"", "options":[], "answer":""}`;

    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-001:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await geminiResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Gemini raw text:', text); // <-- Add this line

    if (!text) return res.status(500).json({ error: 'No valid response from Gemini API' });

    let cleanText = text.trim();
    // Remove Markdown code block if present
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (e) {
      console.error('Failed to parse Gemini response:', cleanText);
      return res.status(500).json({ error: 'Gemini response not valid JSON', raw: cleanText });
    }

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
