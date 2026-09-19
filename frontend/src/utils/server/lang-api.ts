"use server";
import { cookies } from "next/headers";

export async function setLanguage(locale: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "lang",
    value: locale,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}
export async function getLanguage() {
  const cookieStore = await cookies();
  console.log(cookieStore);
  return cookieStore.get("lang")?.value;
}
