import { Collection } from "../models/Collection.model.js";

/* ===============================
   MATCH COLLECTIONS BY TAGS
   - productTags: product ke tags
   - onlyCollections (optional): sirf in collections ke against match
================================ */
export async function matchCollectionsByTags(
  productTags = [],
  onlyCollections = null
) {
  /* ❌ no tags → no match */
  if (!Array.isArray(productTags) || productTags.length === 0) {
    return [];
  }

  /* 🔥 normalize product tags */
  const normalizedProductTags = productTags
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean);

  if (!normalizedProductTags.length) {
    return [];
  }

  /* 🔍 collections source */
  let collections = [];

  // ✅ CASE 1: specific collections passed (edit collection flow)
  if (Array.isArray(onlyCollections) && onlyCollections.length) {
    collections = onlyCollections;
  }
  // ✅ CASE 2: normal flow → all ACTIVE collections
  else {
    collections = await Collection.find({
      status: "Active",
    }).lean();
  }

  const matched = [];

  for (const col of collections) {
    /* ❌ no conditions */
    if (!Array.isArray(col.conditions) || col.conditions.length === 0) {
      continue;
    }

    /* 🔥 normalize condition values */
    const conditionTags = col.conditions
      .map((c) => c?.value)
      .filter(Boolean)
      .map((v) => String(v).trim().toLowerCase());

    if (!conditionTags.length) continue;

    let isMatch = false;

    /* 🔀 matching logic */
    if (col.matchType === "any") {
      isMatch = conditionTags.some((tag) =>
        normalizedProductTags.includes(tag)
      );
    } else {
      // "all"
      isMatch = conditionTags.every((tag) =>
        normalizedProductTags.includes(tag)
      );
    }

    if (!isMatch) continue;

    /* ✅ MATCH FOUND */
    matched.push({
      collection_id: col.collection_id,
      slug: col.slug,
      title: col.title,
      type: col.type, // category | collection
    });
  }

  return matched;
}
