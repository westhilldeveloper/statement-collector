// lib/whatsapp.js
import axios from "axios";

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;

/**
 * Send WhatsApp Template Message (3 params)
 * @param {string} phoneNumber
 * @param {string} param1
 * @param {string} param2
 * @param {string} param3
 */
export async function sendWhatsAppMessage(
  phoneNumber,
  param1,
  param2,
  param3
) {
  try {
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    const formattedPhone = phoneNumber.replace(/\D/g, "");

    // Force all params to string
    const templateParams = [
      param1 ?? "",
      param2 ?? "",
      param3 ?? ""
    ].map(String);

    const response = await axios.post(
      process.env.WHATSAPP_API_URL,
      {
        to: formattedPhone,
        type: "template",
        templateName: "new_chits",
        templateLanguage: "en",
        templateParams
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    

    return { success: true, data: response.data };

  } catch (error) {
    console.error(
      "WhatsApp template failed:",
      error.response?.data || error.message
    );

    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}
