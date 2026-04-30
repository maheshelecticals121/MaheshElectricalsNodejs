import {
    saveContactService,
    getContactService,
  } from "./contact.service.js";
  function sanitize(input) {
    if (typeof input !== "string") return "";
  
    return input
      .replace(/\$/g, "")
      .replace(/{|}/g, "")
      .replace(/<script.*?>.*?<\/script>/gi, "")
      .trim();
  }
  
  /* ======================
     SAVE CONTACT (PUBLIC)
  ====================== */
  export async function saveContact(req, reply) {
    try {
      const { name, email, phone, subject, message } = req.body;
  
      if (!name || !email || !phone || !subject || !message) {
        return reply.send({ success: false, message: "Invalid input" });
      }
  
      const payload = {
        name: sanitize(name),
        email: sanitize(email),
        phone: sanitize(phone),
        subject: sanitize(subject),
        message: sanitize(message),
      };
  
      await saveContactService(payload);
  
      return reply.send({
        success: true,
        message: "Contact saved successfully",
      });
    } catch (err) {
      req.log.error(err);
      return reply.send({
        success: false,
        message: "Request blocked",
      });
    }
  }
  
  /* ======================
     GET CONTACT (ADMIN)
  ====================== */
  export async function getContact(req, reply) {
    try {
      const { page, limit } = req.body;
  
      const data = await getContactService({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
      });
  
      return reply.send({
        success: true,
        ...data,
      });
    } catch (err) {
      req.log.error(err);
      return reply.send({
        success: false,
        message: "Request blocked",
      });
    }
  }
  