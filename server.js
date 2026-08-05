const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '200kb' }));

const EVIDENCE_PATH = path.join(__dirname, 'data', 'evidence.json');

function loadEvidence(){
  try{
    const txt = fs.readFileSync(EVIDENCE_PATH, 'utf8');
    return JSON.parse(txt);
  }catch(e){
    console.warn('Could not load evidence.json', e);
    return {};
  }
}

function simpleJaafariAnalysis(data, method, evidence){
  const text = (data.dreamText || '').toLowerCase();
  const foundSymbols = new Set();
  const evidences = [];

  for(const key in evidence){
    const item = evidence[key];
    if(!item || !item.keywords) continue;
    for(const kw of item.keywords){
      if(text.includes(kw)){
        foundSymbols.add(kw);
        evidences.push({ symbol: kw, quran: item.quran || '', hadith: item.hadith || '', note: item.note || '' });
        break;
      }
    }
  }

  const numbers = (data.numbersMentioned || '') ? (''+data.numbersMentioned).split(/\s+/).filter(Boolean) : [];
  for(const n of numbers) foundSymbols.add(n);
  const symbols = Array.from(foundSymbols);

  let category = 'أضغاث أحلام';
  const alertKeywords = ['حية','ثعبان','أفعى','حريق','دم'];
  const gladKeywords = ['مطر','ماء','رزق','ذهب','فرح','نصر'];
  for(const s of symbols){
    if(alertKeywords.some(k=> s.includes(k))){ category = 'تنبيه'; break; }
    if(gladKeywords.some(k=> s.includes(k))){ category = 'بشرى'; }
  }

  const summaryLines = [];
  summaryLines.push(`المنهج المستخدم: ${method.label}`);
  summaryLines.push(`بوضعيات الرائي: العمر ${data.age || 'غير محدد'}، الحالة الزوجية: ${data.marital || 'غير محددة'}`);
  if(data.sons || data.daughters) summaryLines.push(`أفراد الأسرة: ${data.sons || 0} أبناء، ${data.daughters || 0} بنات`);
  if(symbols.length) summaryLines.push(`الرموز البارزة في الحلم: ${symbols.join(', ')}`);
  summaryLines.push(`التصنيف الاحتمالي: ${category}`);

  let evidenceText = '';
  if(evidences.length){
    evidenceText = evidences.map(e=> `- رمز: ${e.symbol}\n  - القرآن: ${e.quran}\n  - الحديث/الرواية: ${e.hadith}${e.note ? '\n  - ملاحظة: ' + e.note : ''}`).join('\n\n');
  } else if(numbers.length){
    evidenceText = `ذُكرت أرقام في الحلم: ${numbers.join(', ')}. راجع دلالات الأرقام في التراث والقرآن (مثل 7، 40).`;
  } else {
    evidenceText = 'لا يوجد مرجع مباشر في قاعدة الأدلة المحلية لهذه الرموز؛ يُنصح بالرجوع إلى مراجع تفسير معتمدة.';
  }

  let spiritualAdvice = '';
  if(category === 'تنبيه'){
    spiritualAdvice += 'نصيحة: راجع حالتك من جهة العبادة والدعاء، وتحقق من علاقاتك الاجتماعية وتجنب النزاعات. '; 
    spiritualAdvice += 'إن أمكن، استشر عالماً من أهل البيت أو شيخ موثوق.';
  } else if(category === 'بشرى'){
    spiritualAdvice += 'نصيحة: حافظ على الشكر والذكر، واحتسب النعم، وادعُ أن يتقرّب الخير إلى أهلك.';
  } else {
    spiritualAdvice += 'نصيحة: اعتنِ بالصحة النفسية، خصص وقتًا للتأمل والراحة، وتحدث مع قريب موثوق عن ضغوطك.';
  }

  return {
    symbols,
    summary: summaryLines.join('\n'),
    evidence_quran_hadith: evidenceText,
    spiritual_advice: spiritualAdvice,
    category
  };
}

app.post('/api/interpret', (req, res) => {
  const body = req.body || {};
  const evidence = loadEvidence();
  const method = body.method || { label: 'المنهج الجعفري (افتراضي)' };
  const analysis = simpleJaafariAnalysis(body, method, evidence);
  res.json({ success: true, analysis });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Interpretation server listening on ${PORT}`));
