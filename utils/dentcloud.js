
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
// import dotenv from "dotenv";
// dotenv.config();

const DENTCLOUD_API = "https://api.dentcloud.io/v1";
// const API_KEY = process.env.DENT_API_KEY;
// const KEY_ID = process.env.DENT_KEY_ID;

// Main function
export const getMetersFromDentcloud = async (dentApiKey, dentKeyId) => {
  try {
    console.log("🔑 Using API_KEY:", dentApiKey);
    console.log("🔑 Using KEY_ID:", dentKeyId);

    // 1. Get list of meters
    const metersResponse = await axios.get(DENTCLOUD_API, {
      params: { request: "getMeters" },
      headers: {
        "x-api-key": dentApiKey,
        "x-key-id": dentKeyId,
      },
    });

    const meters = metersResponse.data.meters || [];
    let results = [];

    // 2. For each meter, fetch headers
    for (const meter of meters) {
      const dataResponse = await axios.get(DENTCLOUD_API, {
        params: {
          request: "getData",
          year: 2025,
          month: 7,
          day: 5,
          topics: "[kWHNet]",
          meter,
        },
        headers: {
          "x-api-key": dentApiKey,
          "x-key-id": dentKeyId,
        },
      });

      const headers = dataResponse.data.headers || [];
      const channels = headers
        .filter((h) => h.includes("kWHNet/Elm/"))
        .map((h) => h.split("/").pop());

      const combined = channels.map((ch) => `${meter}_${ch}`);
      results.push(...combined);
    }

    return results;
  } catch (error) {
    console.error("❌ Error fetching meter channels:", error.message);
    throw new Error("Failed to fetch meter channels from DentCloud");
  }
};








// For general dashboards and overall usage 
export const getBuildingUsageFromDentcloud = async (dentApiKey, dentKeyId, meterIds, year, month) => {
  try {
    let totalUsage = 0;

    // Loop over owner's saved meterIds
    for (const meter of meterIds) {
      const dataResponse = await axios.get(DENTCLOUD_API, {
        params: {
          request: "getData",
          year,
          month,
          topics: "[kWHNet]",
          meter, // <-- now using owner's meterId
        },
        headers: {
          "x-api-key": dentApiKey,
          "x-key-id": dentKeyId,
        },
      });

      const topics = dataResponse.data.topics || [];
      if (topics.length === 0) continue;

      const first = topics[0];
      const last = topics[topics.length - 1];

      // Calculate usage for all channels in this meter
      for (const key of Object.keys(first)) {
        if (key.startsWith("kWHNet/Elm/")) {
          const startVal = parseFloat(first[key]) || 0;
          const endVal = parseFloat(last[key]) || 0;
          totalUsage += endVal - startVal;
        }
      }
    }

    return totalUsage;
  } catch (error) {
    console.error("❌ DentCloud error:", error.message);
    throw new Error("Failed to fetch building usage from DentCloud");
  }
};