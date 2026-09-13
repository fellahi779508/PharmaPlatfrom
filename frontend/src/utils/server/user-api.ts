"use server";
import { api } from "../api";
import { GetToken } from "./auth-api";
import { getLanguage } from "./lang-api";

export async function GetUserProfile() {
  try {
    const response = await api.get("/user/profile", {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    console.log(response.data);

    return { status: true, response: response.data };
  } catch (error: any) {
    console.log(error);

    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}
