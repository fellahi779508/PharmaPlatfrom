"use server";

import { api } from "../api";
import { GetToken } from "./auth-api";
import { getLanguage } from "./lang-api";

export async function getTodayFlashcard() {
    try {
        const response = await api.get("/flashcard/today", {
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