"use server";

import { api } from "../api";
import { UpdateTask } from "../types/allTypes";
import { CreateMindmap, UpdateMindmap } from "../types/mindmap.types";
import { CreateSummary, UpdateSummary } from "../types/summary.types";
import { GetToken } from "./auth-api";
import { getLanguage } from "./lang-api";

export async function createSummary(data: CreateSummary) {
    try {
        const response = await api.post("/summaries", data, {
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

export async function getSummaries() {
    try {
        const response = await api.get("/summaries", {
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

export async function getSummary(id: number) {
    try {
        const response = await api.get(`/summaries/${id}`, {
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

export async function getSummaryByCourse(courseId: number) {
    try {
        const response = await api.get(`/summaries/course/${courseId}`, {
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

export async function updateSummary(id: number, data: UpdateSummary) {
    try {
        const response = await api.patch(`/summaries/${id}`, data, {
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

export async function deleteSummary(id: number) {
    try {
        const response = await api.delete(`/summaries/${id}`, {
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
export async function createMindMap(data: CreateMindmap) {
    try {
        const response = await api.post("/mindmaps", data, {
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
export async function updateMindMap(id: number, data: UpdateMindmap) {
    try {
        const response = await api.patch(`/mindmaps/${id}`, data, {
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
export async function getMindMapByCourseId(courseId: number) {
    try {
        const response = await api.get(`/mindmaps/course/${courseId}`, {
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
export async function getMindMapById(id: number) {
    try {
        const response = await api.get(`/mindmaps/${id}`, {
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
export async function deleteMindMap(id: number) {
    try {
        const response = await api.delete(`/mindmaps/${id}`, {
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
