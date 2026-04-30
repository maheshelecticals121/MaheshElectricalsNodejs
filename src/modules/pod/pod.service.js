import { PodRequest } from "../../models/PodRequest.model.js";
import { uploadImageBuffer } from "../../utils/uploadToCloudinary.js";

/* =====================================
   SAVE POD REQUEST (FASTIFY SAFE)
===================================== */
export async function savePodService(req) {
    
    const fields = {};
    let frontDesign = null;
    let backDesign = null;
  
    // 🔥 FASTIFY-CORRECT WAY (no attachFieldsToBody needed)
    for await (const part of req.parts()) {
      if (part.type === "file") {
        const buffer = await part.toBuffer();
  
        if (part.fieldname === "frontDesign") {
          frontDesign = await uploadImageBuffer(buffer, "maheshelectricals/pod");
        }
  
        if (part.fieldname === "backDesign") {
          backDesign = await uploadImageBuffer(buffer, "maheshelectricals/pod");
        }
      } else {
        fields[part.fieldname] = part.value;
      }
    }
  
    const {
      user_id,
      product,
      color,
      quality = "Standard",
      instructions = "",
      sides,
    } = fields;
  
    if (!user_id || !product || !color || !sides) {
      throw { statusCode: 400, message: "Required fields missing" };
    }
  
    let parsedSides;
    try {
      parsedSides = JSON.parse(sides);
    } catch {
      throw { statusCode: 400, message: "Invalid sides format" };
    }
  
    const pod = await PodRequest.create({
      user_id,
      product,
      color,
      quality,
      sides: parsedSides,
      instructions,
      frontDesign,
      backDesign,
      status: "Pending",
    });
  
    return pod;
  }
  
  
/* =====================================
   GET ALL POD REQUESTS (ADMIN)
===================================== */
export async function getAllPodService() {
  return PodRequest.find({})
    .populate("user_id", "name email")
    .populate("product", "title price")
    .sort({ createdAt: -1 })
    .lean();
}
