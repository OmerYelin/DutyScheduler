export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image, apiKey } = req.body;

        if (!image || !apiKey) {
            return res.status(400).json({ error: 'Missing image or API Key' });
        }

        const base64Data = image.split(',')[1] || image;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Extract ONLY shifts marked for 'מודיעין'. Return ONLY a JSON array of objects with keys 'day' (ראשון/שני/שלישי/רביעי) and 'type' (e.g. ש.ג 08:00, מטבח בוקר, נשקייה)." },
                        { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: errText });
        }

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = replyText.match(/\[.*\]/s);

        if (jsonMatch) {
            const shifts = JSON.parse(jsonMatch[0]);
            return res.status(200).json({ shifts });
        } else {
            return res.status(422).json({ error: 'No intelligence shifts identified' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
