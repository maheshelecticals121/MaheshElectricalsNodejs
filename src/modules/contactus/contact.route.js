import { adminMiddleware } from "../../middlewares/auth.middleware.js";
import { saveContact, getContact } from "./contact.controller.js";

export default async function contactRoutes(app) {
  app.post("/save_contact", saveContact);

  /* ADMIN */
  app.post(
    "/get_contacts",
    { preHandler: adminMiddleware },
    getContact
  );
}
