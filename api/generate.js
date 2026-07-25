export default async function handler(req, res) {
  // السماح بالاتصال من أي تطبيق أو متصفح
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dreamText } = req.body;

    if (!dreamText) {
      return res.status(400).json({ error: 'نص الحلم مطلوب' });
    }

    // جلب المفتاح الآمن من إعدادات البيئة
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'مفتاح الـ API غير مُعرف في السيرفر' });
    }

    const prompt = `أنت خبير وكبير مفسري الأحلام وتعبير الرؤى وفق المناهج التراثية والتحليل النفسي العميق.
المطلوب منك تقديم تفسير معمق، احترافي، ودقيق جداً للحلم والنصوص المذكورة أدناه.
حلل كل رمز بشكل مستقل (الأشخاص، الأفعال، الأطعمة، الأماكن، المشاعر) ثم اربط بينها وبين أي ظروف واردة في النص.

النص المُدخل من الرائي:
"${dreamText}"

اكتب التفسير بأسلوب رصين وفصيح جداً، مع تقسيم النتيجة إلى:
## التعبير والتأويل العميق
### 1. تفكيك الرموز الرئيسية في الحلم
### 2. إسقاط الرؤيا على الواقع والنفسية
### 3. الخلاصة والتوجيه الإرشادي`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return res.status(200).json({ result: data.candidates[0].content.parts[0].text });
    } else {
      return res.status(500).json({ error: 'فشل في تحليل الرموز' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'حدث خطأ في الاتصال بالخادم' });
  }
}
