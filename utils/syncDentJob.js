import cron from "node-cron";

import Guest from "../models/Guest.js";
import { fetchMeterUsage } from "./meter.js";

export function scheduleDentSync() {
  // Runs at 12 AM and 12 PM daily
  cron.schedule("0 0,12 * * *", async () => {
    console.log("⏰ Running Dent sync job...");

    try {
      const guests = await Guest.find({ meterID: { $ne: null } });

      for (const guest of guests) {
        if (!guest.checkInDate || !guest.checkOutDate) continue;

        try {
          const usageData = await fetchMeterUsage(
            guest.meterID,
            guest.checkInDate,
            guest.checkOutDate
          );

          guest.usage = usageData.usage;
          guest.billing = usageData.billing;
          await guest.save();

          console.log(
            `✅ Updated guest ${guest._id}: usage=${usageData.usage}, billing=${usageData.billing}`
          );
        } catch (err) {
          console.error(`❌ Failed to update guest ${guest._id}:`, err.message);
        }
      }

      console.log("🎉 Dent sync job completed");
    } catch (err) {
      console.error("❌ Dent sync job error:", err.message);
    }
  });
}