"use server";
import { api } from "../api";
import { CreateUser, UpdateUser } from "../types/allTypes";
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

export async function UpdateUserProfile(data: UpdateUser) {
  try {
    const response = await api.put("/user", data, {
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
export async function ChangePassword(currentPass: string, newPassword: string) {
  try {
    const response = await api.put(
      "/user/change-password",
      {
        currentPassword: currentPass,
        newPassword: newPassword,
      },
      {
        headers: {
          "Accept-Language": await getLanguage(),
          Authorization: `Bearer ${await GetToken()}`,
        },
      },
    );
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
