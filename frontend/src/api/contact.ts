import { isAxiosError } from "axios";

import api from "./client";

export interface QuoteRequestPayload {
  name: string;
  phone: string;
  email: string;
  address: string;
  fulfillment: string;
  message: string;
}

export async function submitQuoteRequest(payload: QuoteRequestPayload) {
  const response = await api.post("/contact/quote/", payload);
  return response.data;
}

export interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitContactMessage(payload: ContactFormPayload) {
  try {
    const response = await api.post("/contacts/", payload);
    return response.data;
  } catch (error) {
    const axiosError = error;
    const status = isAxiosError(axiosError) ? axiosError.response?.status : null;

    if (status !== 404 && status !== 405) {
      throw error;
    }

    const response = await api.post("/contact/message/", {
      name: payload.name,
      email: payload.email,
      phone: "",
      message: payload.subject ? `Subject: ${payload.subject}\n\n${payload.message}` : payload.message,
    });

    return response.data;
  }
}
