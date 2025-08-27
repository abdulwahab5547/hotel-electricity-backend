
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const DENTCLOUD_API = "https://api.dentcloud.io/v1";
const API_KEY = process.env.DENT_API_KEY;
const KEY_ID = process.env.DENT_KEY_ID;

export const getMetersFromDentcloud = async () => {
  try {
    // console.log("DentCloud headers:", API_KEY, KEY_ID);
    const response = await axios.get(DENTCLOUD_API, {
      params: { request: "getMeters" },
      headers: {
        "x-api-key": API_KEY,
        "x-key-id": KEY_ID,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching meters:", error.message);
    throw new Error("Failed to fetch meters from DentCloud");
  }
};