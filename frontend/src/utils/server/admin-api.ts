"use server";
import { api } from "../api";
import {
  CreateUser,
  UpdateUser,
  CreateRedeemCode,
  UpdateRedeemCode,
  User,
  RedeemCode,
} from "../types/allTypes";
import { GetToken } from "./auth-api";
import { getLanguage } from "./lang-api";

// User Management APIs for Admin
export async function getAllUsers(
  page: number = 1,
  limit: number = 10,
  search?: string,
) {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search && search.trim()) params.set("search", search.trim());

    const response = await api.get(`/user?${params.toString()}`, {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

export async function getUserById(id: string) {
  try {
    const response = await api.get(`/user/${id}`, {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

export async function createUser(userData: CreateUser) {
  try {
    const response = await api.post("/user", userData, {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

export async function updateUser(id: string, userData: UpdateUser) {
  try {
    const response = await api.put(`/user/update/${id}`, userData, {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

export async function activateUser(id: string) {
  try {
    const response = await api.put(
      `/user/activate/${id}`,
      {},
      {
        headers: {
          "Accept-Language": await getLanguage(),
          Authorization: `Bearer ${await GetToken()}`,
        },
      },
    );
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

export async function deleteUser(id: string) {
  try {
    const response = await api.delete(`/user/${id}`, {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

// Redeem Code Management APIs for Admin
export async function getAllRedeemCodes() {
  try {
    const response = await api.get("/redeem-code", {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

export async function getRedeemCodeById(id: number) {
  try {
    const response = await api.get(`/redeem-code/${id}`, {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

export async function getRedeemCd(yearId: number) {
  try {
    const response = await api.get(`/redeem-code/year/${yearId}`, {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}


export async function postRedeemCode(codeData: CreateRedeemCode) {
  try {
    const response = await api.post("/redeem-code", codeData, {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

export async function updateRedeemCode(id: number, codeData: UpdateRedeemCode) {
  try {
    const response = await api.patch(`/redeem-code/${id}`, codeData, {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

export async function deleteRedeemCode(id: number) {
  try {
    const response = await api.delete(`/redeem-code/${id}`, {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

export async function revokeSubscriptionAdmin(userId: string) {
  try {
    const response = await api.post(
      "/redeem-code/revoke/admin",
      { userId },
      {
        headers: {
          "Accept-Language": await getLanguage(),
          Authorization: `Bearer ${await GetToken()}`,
        },
      },
    );
    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}
