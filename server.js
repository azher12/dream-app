const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// مفتاح الـ API يتم قراءته من متغيرات البيئة في السيرفر لأمان تام
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/api/interpret', async (req, res) => {
  try {
    const { dreamText } = req.body;

    if (!dreamText || dreamText.trim() === '') {
      return res.status(400).json({ error: 'يرجى كتابة نص الحلم' });
    }

    const prompt = `أنت خبير وكبير مفسري الأحلام وتعبير الرؤى وفق المناهج التراثية والتحليل النفسي العميق.
المطلوب منك تقديم تفسير معمق، احترافي، ودقيق جداً للحلم والنصوص المذكورة أدناه.
حلل كل رمز بشكل مستقل (الأشخاص، الأفعال، الأطعمة، الأماكن، المشاعر) ثم اربط بينها وبين الظروف المذكورة بأسلوب سلس ورصين بدون حشو.

النص المُدخل من الرائي:
"${dreamText}"

التنسيق المطلوب:
## التعبير والتأويل العميق
### 1. تفكيك الرموز الرئيسية في الحلم
### 2. إسقاط الرؤيا على الواقع والنفسية
### 3. الخلاصة والتوجيه الإرشادي`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return res.json({ result: data.candidates[0].content.parts[0].text });
    } else {
      return res.status(500).json({ error: 'تعذر معالجة النص بواسطة الذكاء الاصطناعي' });
    }

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'حدث خطأ في الخادم أثناء جلب التفسير' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
