// /api/ideas.js — Vercel Node API route
const RATE_WINDOW_MS = 60_000, RATE_MAX = 20;
const ipHits = new Map();

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
}
async function readJsonSafe(req){
  if (req.body && typeof req.body==='object') return req.body;
  if (typeof req.body==='string'){ try{ return JSON.parse(req.body); }catch{} }
  const chunks=[]; for await (const ch of req) chunks.push(ch);
  const text = Buffer.concat(chunks).toString('utf8')||'';
  try{ return text?JSON.parse(text):{} }catch{ return {} }
}
function rateLimit(req,res){
  const ip=(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'').toString().split(',')[0].trim();
  const now=Date.now(); const b=ipHits.get(ip)||{ts:now,count:0};
  if(now-b.ts>RATE_WINDOW_MS){ b.ts=now; b.count=0; }
  if(++b.count>RATE_MAX){ res.statusCode=429; return {error:'Too many requests'} }
  ipHits.set(ip,b); return null;
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});

  const rl=rateLimit(req,res); if(rl) return res.json(rl);

  try{
    const body=await readJsonSafe(req);
    const description=String(body?.description||'').trim().slice(0,800);
    let lang=String(body?.lang||'nl').trim().toLowerCase();
    if(!['nl','en','fr'].includes(lang)) lang='nl';
    if(!description) return res.status(400).json({error: lang==='nl'?'Ongeldige omschrijving':lang==='fr'?'Description invalide':'Invalid description'});

    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey) return res.status(500).json({error: lang==='nl'?'API-sleutel ontbreekt':lang==='fr'?"Clé d'API manquante":'API key missing'});

    const system = (lang==='nl'?'Je bent een zakelijke copywriter. Antwoord in het Nederlands.'
                    :lang==='fr'?'Tu es un copywriter business. Réponds en français.'
                    :'You are a business copywriter. Answer in English.')
      + ' Provide 3 practical chatbot ideas. Number them 1., 2., 3., use **bold** titles and 1–2 sentences each. Focus on customer service, lead gen, and sales.';

    const user = (lang==='nl'?`Bedrijf: "${description}".`:lang==='fr'?`Entreprise : "${description}".`:`Business: "${description}".`);

    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),25_000);
    const r = await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST', signal:controller.signal,
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
      body:JSON.stringify({ model:'gpt-4o-mini', messages:[{role:'system',content:system},{role:'user',content:user}], temperature:0.7, max_tokens:400 })
    }).catch(err=>{ throw new Error(err?.name==='AbortError'?'Upstream timeout':(err?.message||'Fetch failed')); })
      .finally(()=>clearTimeout(timer));

    let data=null; try{ data=await r.json(); }catch{}
    if(!r.ok){ return res.status(r.status).json({error: data?.error?.message || `HTTP ${r.status}`}); }

    const text=data?.choices?.[0]?.message?.content?.trim();
    if(!text) return res.status(502).json({error: lang==='nl'?'Leeg antwoord van het model':lang==='fr'?'Réponse vide du modèle':'Empty model response'});

    return res.status(200).json({ok:true, text});
  }catch(e){
    const msg=e?.message||'Unknown error'; const code=/timeout|abort/i.test(msg)?504:500;
    return res.status(code).json({error:msg});
  }
}
