import { parseIncoming } from "../utils/parser.js";
import { normalizeIncomingMessage } from "../utils/normalizer.js";
import { patchMetadata, sendMessageToLaburenAgent } from "../services/laburen.service.js";
import { getContact, addNoteToLead, getLead } from "../services/kommo.service.js";
import { sendWppMessage } from "../services/whatsapp.services.js";
import { getCheckboxValue } from "../utils/getCheckboxValue.js";

const idsPausados = new Set();
const conversationMap = new Map();
const whiteList = ['+5491122525125', '+5492233454259', '+5493548412165', '+5493584017740', '+5493584176017', '+5493584238794',
  '+5493584268918', '+5493585066555', '+5493585068050', '+5493585089089', '+5493586020182', '+5492291527949'];

export async function kommoWebhook(req, res) {
  res.sendStatus(204); // responder rápido

  try {
    const contentType = req.headers["content-type"] || "";
    const raw =
      typeof req.body === "string"
        ? req.body
        : req.body?.toString("utf8") || "";

    const parsed = parseIncoming(raw, contentType);

    const normalized = normalizeIncomingMessage(parsed);
    const contact = await getContact(normalized.contact_id);
    
    const lead = getLead(normalized.element_id);
    const checkBoxValue = getCheckboxValue(lead, 1493142); /// 1493142 -> id del campo switch agente

    if (checkBoxValue === true && whiteList.includes(contact.phone)) {
      await processKommoMessage(normalized, contact);
      console.log('--------------------------------------------------------------------------------------------------------------------------------------------------------');
    } else if (checkBoxValue === false) {
      console.log("Objeto pausado");
    }

  } catch (err) {
    console.error("Error en kommoWebhook:", err);
    console.log('--------------------------------------------------------------------------------------------------------------------------------------------------------');
  }

}

async function processKommoMessage(normalized, contact) {

  let conversationId;
  let data;

  if (idsPausados.has(normalized.element_id)) {
    console.log(`⚠️ El elemento ${normalized.element_id} esta pausado, no se enviara Laburen.`);
    return;
  }

  // --- Manejo de conversación en Laburen ---
  if (conversationMap.has(normalized.contact_id)) {
    conversationId = conversationMap.get(normalized.contact_id);
    console.log(`Reusando conversación existente para contact_id ${normalized.contact_id} -> ${conversationId}`);

    data = await sendMessageToLaburenAgent({
      conversationId: conversationId,
      query: normalized.text,
      visitorId: normalized.contact_id
    });
  } else {
    data = await sendMessageToLaburenAgent({
      query: normalized.text,
      visitorId: normalized.contact_id
    });

    conversationId = data?.conversationId;
    conversationMap.set(normalized.contact_id, conversationId);

    console.log(`Nueva conversación asignada para contact_id ${normalized.contact_id}: ${conversationId}`);
    patchMetadata(conversationId, contact.phone, normalized.origin);
  }

  const answer = (data?.answer || "").trim();

  console.log(`${contact.name}: ${normalized.text}`);
  console.log(`Agente: ${answer}`);

  await sendWppMessage(contact.phone, answer);
  await addNoteToLead(normalized.element_id, answer, contact.name);

  return;
}