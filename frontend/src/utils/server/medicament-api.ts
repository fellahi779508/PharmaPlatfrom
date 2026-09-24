"use server";

import { api } from "../api";
import { GetToken } from "./auth-api";
import { getLanguage } from "./lang-api";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface Medicament {
    id: number;
    name: string;
    dci: string | null;
    therapeuticClass: string | null;
    form: string | null;
    dosage: string | null;
    indication: string | null;
    contraindications: string | null;
    sideEffects: string | null;
    posology: string | null;
    notes: string | null;
    image?: {
        id: number;
        url: string;
        width: number;
        height: number;
    } | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateMedicament {
    name: string;
    dci?: string;
    therapeuticClass?: string;
    form?: string;
    dosage?: string;
    indication?: string;
    contraindications?: string;
    sideEffects?: string;
    posology?: string;
    notes?: string;
}

export type UpdateMedicament = Partial<CreateMedicament>;

/* ------------------------------------------------------------------ */
/* CRUD                                                                */
/* ------------------------------------------------------------------ */

export async function getMedicaments(search?: string) {
    try {
        const url = search?.trim()
            ? `/medicament?search=${encodeURIComponent(search.trim())}`
            : "/medicament";
        const response = await api.get(url, {
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

export async function getMedicament(id: number) {
    try {
        const response = await api.get(`/medicament/${id}`, {
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

export async function createMedicament(data: CreateMedicament) {
    try {
        const response = await api.post("/medicament", data, {
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

export async function updateMedicament(
    id: number,
    data: UpdateMedicament,
) {
    try {
        const response = await api.patch(`/medicament/${id}`, data, {
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

export async function deleteMedicament(id: number) {
    try {
        const response = await api.delete(`/medicament/${id}`, {
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

/* ------------------------------------------------------------------ */
/* Image                                                               */
/* ------------------------------------------------------------------ */

export async function uploadMedicamentImage(
    medicamentId: number,
    file: File,
) {
    try {
        const form = new FormData();
        form.append("file", file);

        const response = await api.post(
            `/images/medicament/${medicamentId}`,
            form,
            {
                headers: {
                    "Accept-Language": await getLanguage(),
                    Authorization: `Bearer ${await GetToken()}`,
                    "Content-Type": "multipart/form-data",
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

export async function getMedicamentImage(medicamentId: number) {
    try {
        const response = await api.get(`/images/medicament/${medicamentId}`, {
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

export async function deleteMedicamentImage(medicamentId: number) {
    try {
        const response = await api.delete(`/images/medicament/${medicamentId}`, {
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