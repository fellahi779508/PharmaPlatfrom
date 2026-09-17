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
export async function GetUserStats() {
  try {
    const response = await api.get("/user/stats", {
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

export async function IsActived() {
  try {
    const response = await api.get("/user/isActived", {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });

    return { status: true, response: response.data };
  } catch (error: any) {
    console.log(error);

    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}
export async function RedeemCode(code: string) {
  try {
    const response = await api.post("/redeem-code/assign", { code }, {
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
export async function revokeSubscription(password: string) {

  try {
    const response = await api.post("/user/unsub", { password }, {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    console.log(response.data);

    return { status: true, response: response.data };
  } catch (error: any) {
    console.log(error.response.data.message);

    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}
export async function isVerifedUser() {
  try {
    const response = await api.get("/user/isVerifed", {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });

    return { status: true, response: response.data };
  } catch (error: any) {
    console.log(error);

    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}
