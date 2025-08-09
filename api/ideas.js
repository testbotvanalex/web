export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Нет описания бизнеса' });
  }

  const prompt = `Ты эксперт по чат-ботам. Компания: "${description}". 
  Сгенерируй 3 идеи, как чат-бот может помочь. 
  Формат: 1., 2., 3. с жирным названием.`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await r.json();
    const text = data.choices?.[0]?.message?.content || '';

    res.status(200).json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
