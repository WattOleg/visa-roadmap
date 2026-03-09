export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GH_TOKEN = process.env.GH_TOKEN;
  const GH_USER  = process.env.GH_USER  || 'wattoleg';
  const GH_REPO  = process.env.GH_REPO  || 'roadmap-data';
  const FILE     = 'data.json';
  const API_URL  = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/${FILE}`;

  const headers = {
    'Authorization': `Bearer ${GH_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'vercel-roadmap'
  };

  // GET — load data
  if (req.method === 'GET') {
    const r = await fetch(API_URL, { headers, cache: 'no-store' });
    if (r.status === 404) return res.status(200).json({ milestones: [] });
    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    const json = await r.json();
    const content = Buffer.from(json.content.replace(/\n/g, ''), 'base64').toString('utf8');
    return res.status(200).json({ data: JSON.parse(content), sha: json.sha });
  }

  // PUT — save data
  if (req.method === 'PUT') {
    const { milestones, sha } = req.body;
    const content = Buffer.from(JSON.stringify({ milestones }, null, 2)).toString('base64');
    const body = { message: 'update roadmap', content };
    if (sha) body.sha = sha;
    const r = await fetch(API_URL, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    const json = await r.json();
    return res.status(200).json({ sha: json.content.sha });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
