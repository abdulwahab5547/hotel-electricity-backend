import axios from "axios";

const DENT_API = "https://api.dentcloud.io/v1";

// fetch meter data for a given meterId + date range
export async function fetchMeterUsage(meterId, checkInDate, checkOutDate) {
  try {
    console.log("🔌 Fetching meter usage...");
    console.log("Meter ID:", meterId);
    console.log("Check-in:", checkInDate);
    console.log("Check-out:", checkOutDate);

    const year = checkInDate.getUTCFullYear();
    const month = String(checkInDate.getUTCMonth() + 1).padStart(2, "0");

    console.log("Query Params →", { year, month });

    const res = await axios.get(DENT_API, {
      params: {
        request: "getData",
        year,
        month,
        topics: "[kWHNet]",
        meter: meterId,
      },
      headers: {
        "x-api-key": process.env.DENT_API_KEY,
        "x-key-id": process.env.DENT_KEY_ID,
      },
    });

    console.log("✅ Dent API response received");

    const data = res.data.topics || [];
    console.log("Total readings fetched:", data.length);

    // filter only readings between checkIn and checkOut
    const filtered = data.filter((d) => {
      const dt = new Date(`${d.date}T${d.time}:00Z`);
      return dt >= checkInDate && dt <= checkOutDate;
    });

    console.log("Filtered readings:", filtered.length);

    if (filtered.length < 2) {
      console.log("⚠️ Not enough readings to calculate usage");
      return { usage: 0, billing: 0 };
    }

    const first = parseFloat(filtered[0]["kWHNet/Elm/A"]);
    const last = parseFloat(filtered[filtered.length - 1]["kWHNet/Elm/A"]);

    console.log("First reading:", first);
    console.log("Last reading:", last);

    const usage = last - first;
    const billing = usage * 0.15; // example rate $0.15 per kWh

    console.log("📊 Calculated → Usage:", usage, "kWh | Billing:", billing, "$");

    return { usage, billing };
  } catch (err) {
    console.error("❌ Dent API error:", err.response?.data || err.message);
    return { usage: 0, billing: 0 };
  }
}
