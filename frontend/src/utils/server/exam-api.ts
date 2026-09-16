"use server";

import { api } from "../api";
import { Semester, Subject, Exam } from "../types/allTypes";
import { GenerateExamPayload, ExamSession, ExamSessionProgress, SubmitAnswerPayload, SubmitAnswerResponse, ExamSessionResults } from "../types/exam.types";
import { GetToken } from "./auth-api";
import { getLanguage } from "./lang-api";


/* ------------------------------------------------------------------ */
/*  Shared headers                                                     */
/* ------------------------------------------------------------------ */

async function authHeaders() {
    return {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
    };
}

/* ------------------------------------------------------------------ */
/*  Catalog (for the create modal)                                     */
/* ------------------------------------------------------------------ */

export async function getSemesters() {
    try {
        const response = await api.get("/exam/catalog/semesters", {
            headers: await authHeaders(),
        });
        console.log(response.data);

        return { status: true, response: response.data as Semester[] };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

export async function getSubjects() {
    try {
        const response = await api.get("/exam/catalog/subjects", {
            headers: await authHeaders(),
        });
        return { status: true, response: response.data as Subject[] };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

/** Subjects belonging to a semester's year – use if your backend supports it. */
export async function getSubjectsByYear(yearId: number) {
    try {
        const response = await api.get(`/subject/year/${yearId}`, {
            headers: await authHeaders(),
        });
        return { status: true, response: response.data as Subject[] };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

/* ------------------------------------------------------------------ */
/*  Exam                                                               */
/* ------------------------------------------------------------------ */

export async function generateExam(data: GenerateExamPayload) {
    try {
        const response = await api.post("/exam/generate", data, {
            headers: await authHeaders(),
        });
        return { status: true, response: response.data as Exam };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

export async function getExams() {
    try {
        const response = await api.get("/exam", {
            headers: await authHeaders(),
        });
        return { status: true, response: response.data as Exam[] };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

export async function getExam(id: number) {
    try {
        const response = await api.get(`/exam/${id}`, {
            headers: await authHeaders(),
        });
        return { status: true, response: response.data };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

/* ------------------------------------------------------------------ */
/*  Exam sessions                                                      */
/* ------------------------------------------------------------------ */

export async function getUserExamSessions() {
    try {
        const response = await api.get("/exam/sessions/mine", {
            headers: await authHeaders(),
        });
        return { status: true, response: response.data as ExamSession[] };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

export async function startExamSession(examId: number) {
    try {
        const response = await api.post(
            `/exam/${examId}/sessions/start`,
            {},
            { headers: await authHeaders() },
        );
        return { status: true, response: response.data as ExamSession };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

export async function getExamSessionProgress(sessionId: number) {
    try {
        const response = await api.get(`/exam/sessions/${sessionId}`, {
            headers: await authHeaders(),
        });
        return { status: true, response: response.data as ExamSessionProgress };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

export async function pauseExamSession(sessionId: number) {
    try {
        const response = await api.patch(
            `/exam/sessions/${sessionId}/pause`,
            {},
            { headers: await authHeaders() },
        );
        return { status: true, response: response.data as ExamSession };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

export async function resumeExamSession(sessionId: number) {
    try {
        const response = await api.patch(
            `/exam/sessions/${sessionId}/resume`,
            {},
            { headers: await authHeaders() },
        );
        return { status: true, response: response.data as ExamSession };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

export async function submitExamAnswer(
    sessionId: number,
    data: SubmitAnswerPayload,
) {
    try {
        const response = await api.post(
            `/exam/sessions/${sessionId}/answer`,
            data,
            { headers: await authHeaders() },
        );
        return { status: true, response: response.data as SubmitAnswerResponse };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

export async function completeExamSession(sessionId: number) {
    try {
        const response = await api.post(
            `/exam/sessions/${sessionId}/complete`,
            {},
            { headers: await authHeaders() },
        );
        return { status: true, response: response.data as ExamSession };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}

export async function getExamSessionResults(sessionId: number) {
    try {
        const response = await api.get(`/exam/sessions/${sessionId}/results`, {
            headers: await authHeaders(),
        });
        return { status: true, response: response.data as ExamSessionResults };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}
export async function deleteExamSession(sessionId: number) {
    try {
        const response = await api.delete(`/exam/sessions/${sessionId}`, {
            headers: await authHeaders(),
        });
        return { status: true, response: response.data as { success: true } };
    } catch (error: any) {
        return { status: false, message: error.response?.data?.message };
    }
}