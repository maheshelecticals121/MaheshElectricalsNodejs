import cloudinary from "../config/cloudinary.js";

/**
 * Upload image buffer to Cloudinary
 * - auto convert to WEBP
 * - keep original dimension
 * - optimized quality
 */
export async function uploadImageBuffer(
  buffer,
  folder = "maheshelectricals/products"
) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",

          // 🔥 OPTIMIZATION
          format: "webp",
          quality: "auto:good",
          fetch_format: "auto",

          // CDN speed
          flags: "progressive",

        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}
