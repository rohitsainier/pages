#!/usr/bin/env node
/*
 * Makes the ElevenLabs character voices for index.html: one MP3 per spoken line in ./voice/ plus voice/manifest.json,
 * which the page plays (browser text-to-speech covers any line that has no clip). Run it on your own machine: the API
 * key is only read here and never goes into the page.
 *
 *   node v/sorry/make-voices.mjs --env ~/Documents/AI/reel/.env      (or export ELEVENLABS_API_KEY)
 *   --force          redo every clip
 *   --only veenu     redo one character's lines
 *
 * A clip is reused while its line, voice, model and settings are unchanged, so editing one line pays for one line.
 * In LINES the first string must match the text in index.html exactly (the page looks clips up by it); the second is
 * what ElevenLabs reads: Devanagari for proper Hindi, plus eleven_v3 audio tags such as [laughs] for the delivery.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VOICES = {
  rohit:    'r21m7BAbXjtux814CeJE', // Kavish - Clear, Expressive and Admiring
  veenu:    'dVTC43Yewy5fAIcmsISI', // Anvi - Warm, Emotional Girlfriend
  narrator: 'FFmp1h1BMl0iVHA0JxrI', // Tarini - Soft, Cheerful and Expressive
  worm:     'nfMYisZqs1GOjTFllho3', // Gungun - Kids Show Character
};
const MODEL = 'eleven_v3', FORMAT = 'mp3_44100_96', SETTINGS = { stability: .5 };

const LINES = {
  narrator: [
    ['Ye kahani hai <b>Rohit</b> aur <b>Veenu</b> ki…', 'ये कहानी है रोहित और वीनू की…'],
    ['Ek ladka, jiske sawaal kabhi khatam hi nahi hote…', 'एक लड़का, जिसके सवाल कभी ख़त्म ही नहीं होते…'],
    ['…aur ek ladki, jiska gussa hamesha naak pe rehta hai. 😤', '[playfully] …और एक लड़की, जिसका ग़ुस्सा हमेशा नाक पे रहता है।'],
    ['Gussa meter, khatra!', '[dramatic] ग़ुस्सा मीटर… ख़तरा!'],
    ['Rohit ne chupchaap safed jhanda utha diya.', '[whispers] रोहित ने चुपचाप सफ़ेद झंडा उठा दिया।'],
    ['Rohit ne ek bhi shabd nahi kaha.', 'रोहित ने एक भी शब्द नहीं कहा।'],
    ['Kyunki woh jaanta tha… Veenu gusse mein hai, par uske dil mein sirf pyaar hai. ❤️', 'क्योंकि वो जानता था… वीनू ग़ुस्से में है, पर उसके दिल में सिर्फ़ प्यार है।'],
    ['Woh har pal bas usi ke baare mein sochta rehta hai…', '[softly] वो हर पल बस उसी के बारे में सोचता रहता है…'],
    ['…isiliye toh baar baar poochta hai. 🙈', '[giggles] …इसीलिए तो बार बार पूछता है।'],
    ['Phir gussa aansu ban gaya… aur Veenu ro padi. 😢', '[sad] फिर ग़ुस्सा आँसू बन गया… और वीनू रो पड़ी।'],
    ['…aur jab Veenu roti hai, toh Rohit bhi ro padta hai. 😭', '[sad] …और जब वीनू रोती है, तो रोहित भी रो पड़ता है।'],
    ['Itna roye dono, ki ghar mein naav chal padi!', '[laughs] इतना रोए दोनों, कि घर में नाव चल पड़ी!'],
    ['Kyunki ladaai chahe kitni bhi badi ho…', '[softly] क्योंकि लड़ाई चाहे कितनी भी बड़ी हो…'],
    ['…pyaar hamesha usse bada hota hai. ❤️', '[warmly] …प्यार हमेशा उससे बड़ा होता है।'],
  ],
  rohit: [
    ['Veenu, khana khaya? 🥺', '[sweetly] वीनू, खाना खाया?'],
    ['Pakka khaya?', 'पक्का खाया?'],
    ['Kya khaya?', '[curious] क्या खाया?'],
    ['Achha… toh khana khaya? 😇', '[innocently] अच्छा… तो खाना खाया?'],
    ['Bas confirm kar raha tha…', '[nervously] बस confirm कर रहा था…'],
    ['Sorry Veenu… 🥺 Main baar baar isliye poochta hoon, kyunki mujhe tumhari fikar hai.', '[softly] Sorry वीनू… मैं बार बार इसलिए पूछता हूँ, क्योंकि मुझे तुम्हारी फ़िक्र है।'],
    ['Aur sach bataun? Tumhari awaaz sunne ka bahana chahiye hota hai. 🙈', '[shyly] और सच बताऊँ? तुम्हारी आवाज़ सुनने का बहाना चाहिए होता है।'],
    ['Haan… par sirf tumhara pagal. ❤️', '[warmly] हाँ… पर सिर्फ़ तुम्हारा पागल।'],
    ['Sorry Veenu. Main tumse bahut pyaar karta hoon. Maaf kiya?', '[softly] Sorry वीनू। मैं तुमसे बहुत प्यार करता हूँ। [hopeful] माफ़ किया?'],
    ['Yayyy! Ab ek last sawaal. Khana khaya?', '[excited] Yayyy! अब एक last सवाल… [mischievously] खाना खाया?'],
  ],
  veenu: [
    ['Haan, kha liya. 😊', '[cheerfully] हाँ, खा लिया।'],
    ['Haan Rohit… kha liya.', '[sighs] हाँ रोहित… खा लिया।'],
    ['Rajma chawal.', '[annoyed] राजमा चावल।'],
    ['Gadhi ki gaand!', '[shouting] गधी की गांड!'],
    ['Tumhari gaand mein <b>keeda</b> hai kya?! Ek hi sawaal baar baar! 😡', '[angry] तुम्हारी गांड में कीड़ा है क्या?! [shouting] एक ही सवाल बार बार!'],
    ['Pagal ho tum… 🥲', '[sniffles] पागल हो तुम…'],
    ['Hahaha! Gadhi ki gaand! 😂', '[laughs] हाहाहा! गधी की गांड!'],
  ],
  worm: [
    ['Hi! 👋 Main hi hoon woh keeda.', '[excited] Hi! मैं ही हूँ वो कीड़ा!'],
    ['Keeda bhi sorry bol raha hai! 🐛❤️', '[cheerfully] कीड़ा भी sorry बोल रहा है!'],
  ],
};

// identical to V.clean in index.html: the page looks a clip up by "<role>|<cleaned text>"
const clean = t => t.replace(/<[^>]+>/g, '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2B50}\u{2764}]/gu, '').replace(/…/g, ', ').replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim();

const args = process.argv.slice(2), flag = n => args.includes(n), opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const here = dirname(fileURLToPath(import.meta.url)), out = join(here, 'voice'), manPath = join(out, 'manifest.json');

function apiKey(){
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const f = opt('--env') || join(here, '.env');
  if (!existsSync(f)) return null;
  const m = readFileSync(f, 'utf8').match(/^\s*ELEVENLABS_API_KEY\s*=\s*['"]?([^'"\s#]+)/m);
  return m && m[1];
}
const KEY = apiKey();
if (!KEY){ console.error('No ElevenLabs key: set ELEVENLABS_API_KEY or pass --env path/to/.env'); process.exit(1); }

const old = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : {};
const only = opt('--only'), force = flag('--force');
const speakText = t => MODEL.startsWith('eleven_v3') ? t : t.replace(/\[[^\]]+\]\s*/g, ''); // older models would read the tags aloud
const jobs = [], manifest = {};
for (const [role, lines] of Object.entries(LINES)) for (const [line, say] of lines){
  const key = role + '|' + clean(line), text = speakText(say);
  const sig = createHash('sha1').update(JSON.stringify([VOICES[role], MODEL, FORMAT, SETTINGS, text])).digest('hex');
  const file = `${role}-${sig.slice(0, 10)}.mp3`;
  manifest[key] = { file, sig };
  const fresh = old[key] && old[key].sig === sig && existsSync(join(out, file));
  if (force || (only ? only === role : !fresh)) jobs.push({ key, role, text, file });
}

async function tts(job){
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICES[job.role]}?output_format=${FORMAT}`;
  for (let tries = 1; ; tries++){
    const r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text: job.text, model_id: MODEL, voice_settings: SETTINGS }) });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    const body = await r.text();
    if ((r.status === 429 || r.status >= 500) && tries < 5){ await new Promise(s => setTimeout(s, 1500 * tries)); continue; }
    throw new Error(`${job.key}: HTTP ${r.status} ${body.slice(0, 300)}`);
  }
}

mkdirSync(out, { recursive: true });
console.log(`${jobs.length} clip(s) to make, ${jobs.reduce((n, j) => n + j.text.length, 0)} characters (${Object.keys(manifest).length - jobs.length} reused)`);
const queue = [...jobs];
await Promise.all([0, 1].map(async () => {
  for (let job; (job = queue.shift()); ){
    writeFileSync(join(out, job.file), await tts(job));
    console.log('  ✓', job.key);
  }
}));

const keep = new Set(Object.values(manifest).map(m => m.file));
for (const f of readdirSync(out)) if (/^(rohit|veenu|narrator|worm)-[0-9a-f]{10}\.mp3$/.test(f) && !keep.has(f)) unlinkSync(join(out, f));
writeFileSync(manPath, JSON.stringify(manifest, null, 1) + '\n');
console.log('wrote', manPath);
