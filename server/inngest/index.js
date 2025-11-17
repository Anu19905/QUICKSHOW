// inngest/index.js
import { Inngest } from "inngest";
import User from "../models/User.js";

/**
 * IMPORTANT: make sure you have set the env var exactly as:
 * INNGEST_SIGNING_KEY=signkey-prod-...
 */
export const inngest = new Inngest({
  id: "movie-ticket-booking",
  signingKey: process.env.INNGEST_SIGNING_KEY, // <- very important
});

// Helper: small safe wrapper for DB operations (prevents crash on error)
const safe = (fn) => async (args) => {
  try {
    await fn(args);
  } catch (err) {
    console.error("[inngest function error]", err);
    // you can also send to your logger here
  }
};

// Create functions
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  safe(async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const userData = {
      _id: id,
      email: email_addresses?.[0]?.email_address || "",
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      image: image_url || "",
    };
    await User.create(userData);
  })
);

const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  safe(async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  })
);

const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  safe(async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const userData = {
      _id: id,
      email: email_addresses?.[0]?.email_address || "",
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      image: image_url || "",
    };
    await User.findByIdAndUpdate(id, userData);
  })
);

// Export either an array or object — your serve() accepted an array earlier
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];
