"use server";
import { api } from "../api";
import { cookies } from "next/headers";
import { getLanguage } from "./lang-api";
import { redirect } from "next/navigation";
import { CreateUser } from "../types/allTypes";

export async function Login(email: string, password: string) {
  try {
    const response = await api.post(
      "/auth/login",
      { email, password },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": await getLanguage(),
        },
      },
    );

    // Adjust this based on your backend response structure (e.g., response.data.accessToken)
    const token = response.data.token;

    if (token) {
      const cookieStore = await cookies();
      cookieStore.set({
        name: "token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 5, // 1 week
      });
    }
    await setRole(response.data.role);

    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message || "Une erreur est survenue",
    };
  }
}
export async function GetToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value || null;
}

export async function Register(data: CreateUser) {
  try {
    const response = await api.post("/user", data, {
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": await getLanguage(),
      },
    });

    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message || "Une erreur est survenue",
    };
  }
}
export async function VerifyOTP(email: string, otp: string) {
  try {
    const response = await api.post(
      "/email/verify-otp",
      { email, otp },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": await getLanguage(),
          Authorization: `Bearer ${await GetToken()}`,
        },
      },
    );

    return { status: true, response: response.data };
  } catch (error: any) {
    console.log(error.response?.data?.message);

    return {
      status: false,
      message: error.response?.data?.message || "Une erreur est survenue",
    };
  }
}
export async function ResendOTP(email: string) {
  try {
    const response = await api.get(
      "/email/otpCode",

      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": await getLanguage(),
          Authorization: `Bearer ${await GetToken()}`,
        },
      },
    );

    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message || "Une erreur est survenue",
    };
  }
}
export async function authOtp() {
  try {
    const response = await api.get(
      "/email/otpCode/auth",

      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": await getLanguage(),
          Authorization: `Bearer ${await GetToken()}`,
        },
      },
    );

    return { status: true, response: response.data };
  } catch (error: any) {
    return {
      status: false,
      message: error.response?.data?.message || "Une erreur est survenue",
    };
  }
}
export async function logOut() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("role");
  return { status: true, message: "Déconnexion réussie" };
}
export async function setRole(role: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "role",
    value: role,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 5,
  });
  return { status: true, message: "Rôle défini avec succès" };
}
export async function getRole(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("role")?.value || null;
}
