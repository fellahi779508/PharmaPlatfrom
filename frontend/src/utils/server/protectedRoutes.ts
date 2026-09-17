/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getLanguage } from "./lang-api";
import { IsActived } from "./user-api";

async function getVerifiedPayload() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET!),
    );
    return payload;
  } catch (error) {
    console.log(error);

    return null;
  }
}

export async function requireAuth() {
  const payload = await getVerifiedPayload();
  const locale = (await getLanguage()) || "fr";

  if (!payload) {
    redirect(`/${locale}/login`);
  }

  return payload!;
}

export async function AdminRoute() {
  const payload = await requireAuth();
  const locale = (await getLanguage()) || "fr";
  const role = payload.role || (payload.user as any)?.role;

  if (!["admin", "owner"].includes(role)) {
    redirect(`/${locale}/dashboard`);
  }

  return payload;
}

export async function TeacherRoute() {
  const payload = await requireAuth();
  const locale = (await getLanguage()) || "fr";
  const role = payload.role || (payload.user as any)?.role;

  if (!["teacher", "admin", "owner"].includes(role)) {
    redirect(`/${locale}/dashboard`);
  }

  return payload;
}

export async function redirectIfLoggedIn() {
  const payload = await getVerifiedPayload();
  if (!payload) return;

  const locale = (await getLanguage()) || "fr";
  const role = payload.role || (payload.user as any)?.role;

  if (["admin", "owner"].includes(role)) {
    redirect(`/${locale}/admin`);
  } else if (role === "teacher") {
    redirect(`/${locale}/teacher`);
  } else {
    redirect(`/${locale}/dashboard`);
  }
}

export async function isActivedRoute() {
  const resp = await IsActived();
  if (resp.status) {
    if (resp.response) {
      return true
    }
    return false;
  }
}

