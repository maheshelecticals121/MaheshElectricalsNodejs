import { Contact } from "../../models/Contact.model.js";

/* SAVE */
export async function saveContactService(payload) {
  return await Contact.create(payload);
}

/* GET */
export async function getContactService({ page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Contact.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Contact.countDocuments(),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
