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

        const systemPrompt = `
Analyze this military duty roster table. Find all slots marked specifically as "מודיעין".
For each slot marked "מודיעין", extract:
1. 'day': ראשון, שני, שלישי, or רביעי.
2. 'type': The shift type based on column header and time.
   Examples of formats to return:
   - "ש.ג 00:00" or "ש.ג 12:00"
   - "נשקייה 08:00" or "נשקייה 12:00"
   - "מטבח ערב" or "מטבח בוקר"
   - "רס"ר ערב" or "רס"ר בוקר"
   - "ליווי קבלנים"

Return ONLY a valid JSON array of objects with keys "day" and "type". No markdown wrap, no extra text.
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: systemPrompt },
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
