import axios from "axios";
const KOMMO_BASE_URL = process.env.KOMMO_BASE_URL;
const KOMMO_LONG_DURATION_TOKEN = process.env.KOMMO_LONG_DURATION_TOKEN;

export async function getLead(leadId) {
  try {
    const res = await axios.get(
      `${KOMMO_BASE_URL}/api/v4/leads/${leadId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${KOMMO_LONG_DURATION_TOKEN}`
        }
      }
    );

    return res.data || null;

  } catch (error) {
    console.error("Error en getLead:", error?.response?.data || error);
    return null;
  }
}

export async function getContact(contactId) {
  try {
    const response = await axios.get(`${KOMMO_BASE_URL}/api/v4/contacts/${contactId}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${KOMMO_LONG_DURATION_TOKEN}`
      }
    });

    const contact = response.data;

    const name = contact.name;

    // Número: buscar en custom_fields_values
    let phone = null;
    if (contact.custom_fields_values) {
      const phoneField = contact.custom_fields_values.find(
        f => f.field_code === "PHONE"
      );
      if (phoneField && phoneField.values && phoneField.values.length > 0) {
        phone = phoneField.values[0].value;
      }
    }

    return { name, phone };

  } catch (error) {
    console.error("Error en getContact:", error.response?.data || error.message);
    throw error;
  }
}

export async function addNoteToLead(leadId, noteText, leadName) {
  try {
    const response = await axios.post(
      `${KOMMO_BASE_URL}/api/v4/leads/${leadId}/notes`,
      [
        {
          note_type: "sms_out",
          "params": {
            "text": noteText,
            "phone": leadName
          }
        }
      ],
      {
        headers: {
          Authorization: `Bearer ${KOMMO_LONG_DURATION_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log('✅ Mensaje enviado a Kommo');
    return response.data;
  } catch (error) {
    console.error("Error al agregar nota al lead:", error.response?.data || error.message);
    throw error;
  }
}

export async function updateLead(leadId, customFieldId, agentResponse) {
  try {
    const res = await axios.patch(
      `${KOMMO_BASE_URL}/api/v4/leads/${leadId}`,
      {
        custom_fields_values: [
          {
            field_id: customFieldId,
            values: [
              { value: agentResponse }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${KOMMO_LONG_DURATION_TOKEN}`
        }
      }
    );

    return res.data;

  } catch (error) {
    console.error("Error al actualizar el lead:", error.response?.data || error.message);
  }
}

export async function launchSalesBot(bot_id, entity_id, entity_type) {
  try {
    const res = await axios.post(
      `${KOMMO_BASE_URL}/api/v2/salesbot/run`,
      [{
        "bot_id": bot_id,
        "entity_id": entity_id,
        "entity_type": entity_type
      }],
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${KOMMO_LONG_DURATION_TOKEN}`
        }
      }
    );

    return res.data;
  } catch (error) {
    console.error("Error launching bot: ", error.response?.data || error);
  }
}