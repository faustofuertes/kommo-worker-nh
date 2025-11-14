const BASE = process.env.LABUREN_BASE_URL;
const AGENT_ID = process.env.LABUREN_AGENT_ID;
const AUTHORIZATION = process.env.LABUREN_AUTHORIZATION;

export async function sendMessageToLaburenAgent({ conversationId, query, timeoutMs = 15000 }) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE}/agents/${AGENT_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AUTHORIZATION}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversationId, query }),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`Laburen ${res.status}: ${text}`);
    return JSON.parse(text); // { answer, conversationId, visitorId, ... }
  } finally {
    clearTimeout(t);
  }
}

export async function patchMetadata(conversationId, canal, numero) {
  try {
    const res = await fetch(`${BASE}/conversations/${conversationId}/metadata`, {
      method: 'PATCH',
      headers: {
        "Authorization": `Bearer ${AUTHORIZATION}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        metadata: {
          conversationId: conversationId,
          canal: canal,
          numero: numero,
        }
      }),
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`Laburen ${res.status}: ${text}`);
    return JSON.parse(text);
  } catch (error) {
    console.error(error);
  }
}