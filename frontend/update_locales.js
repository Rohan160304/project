const fs = require('fs');
const files = {
  en: 'src/locales/en.js',
  hi: 'src/locales/hi.js',
  gu: 'src/locales/gu.js'
};

const additions = {
  en: `,\n  "🕒 Temple Timings": "🕒 Temple Timings",\n  "🕒 Jain Centre Timings": "🕒 Jain Centre Timings",\n  "🕒 Dharamshala Timings": "🕒 Dharamshala Timings",\n  "🕒 Bhojanshala Timings": "🕒 Bhojanshala Timings",\n  "🕒 Pathshala Timings": "🕒 Pathshala Timings",\n  "🕒 Community Hall Timings": "🕒 Community Hall Timings",\n  "🕒 Trust Office Timings": "🕒 Trust Office Timings",\n  "🕒 Sthanak Timings": "🕒 Sthanak Timings",\n  "🕒 Gaushala Timings": "🕒 Gaushala Timings"\n`,
  hi: `,\n  "🕒 Temple Timings": "🕒 मंदिर समय",\n  "🕒 Jain Centre Timings": "🕒 जैन सेंटर समय",\n  "🕒 Dharamshala Timings": "🕒 धर्मशाला समय",\n  "🕒 Bhojanshala Timings": "🕒 भोजनालय समय",\n  "🕒 Pathshala Timings": "🕒 पाठशाला समय",\n  "🕒 Community Hall Timings": "🕒 कम्युनिटी हॉल समय",\n  "🕒 Trust Office Timings": "🕒 ट्रस्ट ऑफिस समय",\n  "🕒 Sthanak Timings": "🕒 स्थानक समय",\n  "🕒 Gaushala Timings": "🕒 गौशाला समय"\n`,
  gu: `,\n  "🕒 Temple Timings": "🕒 મંદિર સમય",\n  "🕒 Jain Centre Timings": "🕒 જૈન સેન્ટર સમય",\n  "🕒 Dharamshala Timings": "🕒 ધર્મશાળા સમય",\n  "🕒 Bhojanshala Timings": "🕒 ભોજનશાળા સમય",\n  "🕒 Pathshala Timings": "🕒 પાઠશાળા સમય",\n  "🕒 Community Hall Timings": "🕒 કમ્યુનિટી હોલ સમય",\n  "🕒 Trust Office Timings": "🕒 ટ્રસ્ટ ઓફિસ સમય",\n  "🕒 Sthanak Timings": "🕒 સ્થાનક સમય",\n  "🕒 Gaushala Timings": "🕒 ગૌશાળા સમય"\n`
};

for (const [lang, filepath] of Object.entries(files)) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/};\s*$/, additions[lang] + '};\n');
  fs.writeFileSync(filepath, content);
}
console.log("Updated locales");
