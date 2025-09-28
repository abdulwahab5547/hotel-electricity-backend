
// import axios from "axios";
// import dotenv from "dotenv";
// dotenv.config();

// const DENTCLOUD_API = "https://api.dentcloud.io/v1";
// const API_KEY = process.env.DENT_API_KEY;
// const KEY_ID = process.env.DENT_KEY_ID;

// export const getMetersFromDentcloud = async () => {
//   try {
//     const response = await axios.get(DENTCLOUD_API, {
//       params: { request: "getMeters" },
//       headers: {
//         "x-api-key": API_KEY,
//         "x-key-id": KEY_ID,
//       },
//     });

//     return response.data;
//   } catch (error) {
//     console.error("Error fetching meters:", error.message);
//     throw new Error("Failed to fetch meters from DentCloud");
//   }
// };


import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const DENTCLOUD_API = "https://api.dentcloud.io/v1";
const API_KEY = process.env.DENT_API_KEY;
const KEY_ID = process.env.DENT_KEY_ID;

// Main function
export const getMetersFromDentcloud = async () => {
  try {
    console.log("🔑 Using API_KEY:", API_KEY);
    console.log("🔑 Using KEY_ID:", KEY_ID);

    // 1. Get list of meters
    const metersResponse = await axios.get(DENTCLOUD_API, {
      params: { request: "getMeters" },
      headers: {
        "x-api-key": API_KEY,
        "x-key-id": KEY_ID,
      },
    });

    console.log("📡 Raw metersResponse:", metersResponse.data);

    const meters = metersResponse.data.meters || [];
    console.log("✅ Meters list:", meters);

    let results = [];

    // 2. For each meter, fetch headers (using a sample date just to get structure)
    for (const meter of meters) {
      console.log(`\n➡️ Fetching headers for meter: ${meter}`);

      const dataResponse = await axios.get(DENTCLOUD_API, {
        params: {
          request: "getData",
          year: 2025,   // pick a valid year/month/day
          month: 7,
          day: 5,
          topics: "[kWHNet]",
          meter,
        },
        headers: {
          "x-api-key": API_KEY,
          "x-key-id": KEY_ID,
        },
      });

      console.log(`📡 Raw dataResponse for ${meter}:`, dataResponse.data);

      const headers = dataResponse.data.headers || [];
      console.log(`📑 Headers for ${meter}:`, headers);

      // 3. Extract channel suffixes (like A, B, etc.)
      const channels = headers
        .filter((h) => h.includes("kWHNet/Elm/"))
        .map((h) => h.split("/").pop());

      console.log(`🔎 Channels extracted for ${meter}:`, channels);

      // 4. Combine with meter ID
      const combined = channels.map((ch) => `${meter}_${ch}`);
      console.log(`✅ Combined for ${meter}:`, combined);

      results.push(...combined);
    }

    console.log("\n🎉 Final Results:", results);
    return results;
  } catch (error) {
    console.error("❌ Error fetching meter channels:", error.message);
    throw new Error("Failed to fetch meter channels from DentCloud");
  }
};
