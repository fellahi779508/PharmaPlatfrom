"use server";

import { api } from "../api";
import {
  CreateSession,
  SessionPlayState,
  UpdateSession,
} from "../types/session.types";
import { GetToken } from "./auth-api";
import { getLanguage } from "./lang-api";

// ---------------------------------------------------------------------------
// Shared headers
// ---------------------------------------------------------------------------
async function authHeaders() {
  return {
    "Accept-Language": await getLanguage(),
    Authorization: `Bearer ${await GetToken()}`,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------
export async function createSession(data: CreateSession) {
  try {
    const response = await api.post("/session", data, {
      headers: await authHeaders(),
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message:
        error.response?.data?.message ??
        "Failed to create session. Please try again.",
    };
  }
}

export async function getSessions() {
  try {
    const response = await api.get("/session", {
      headers: await authHeaders(),
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

export async function getSessionsOfStudent() {
  try {
    const response = await api.get("/session/me", {
      headers: await authHeaders(),
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

export async function getSession(id: number) {
  try {
    const response = await api.get(`/session/${id}`, {
      headers: await authHeaders(),
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

export async function updateSession(id: number, data: UpdateSession) {
  try {
    const response = await api.patch(`/session/${id}`, data, {
      headers: await authHeaders(),
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

export async function deleteSession(id: number) {
  try {
    const response = await api.delete(`/session/${id}`, {
      headers: await authHeaders(),
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

// ---------------------------------------------------------------------------
// Play / reveal / next / draft
// ---------------------------------------------------------------------------

/**
 * GET /session/:id/play
 * Returns the current question for the session (resumes at currentQuestionId).
 */
export async function getSessionPlay(id: number) {
  try {
    const response = await api.get(`/session/${id}/play`, {
      headers: await authHeaders(),
    });
    // Backend returns SessionPlayState directly
    return { status: true, response: response.data as SessionPlayState };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

/**
 * POST /session/:id/questions/:questionId/reveal
 * Reveals correctness + explanations for a question.
 */
export async function revealAnswer(
  sessionId: number,
  questionId: number,
  selectedAnswerIds: number[],
) {
  try {
    const response = await api.post(
      `/session/${sessionId}/questions/${questionId}/reveal`,
      { selectedAnswerIds },
      { headers: await authHeaders() },
    );
    // Backend returns { status: true, result: SessionPlayState }
    return response.data as { status: boolean; result: SessionPlayState };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

/**
 * POST /session/:id/next
 * Advances to the next question, or completes the session.
 */
export async function nextQuestion(sessionId: number) {
  try {
    const response = await api.post(
      `/session/${sessionId}/next`,
      {},
      { headers: await authHeaders() },
    );
    // Backend returns SessionPlayState directly
    return { status: true, response: response.data as SessionPlayState };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

/**
 * POST /session/:id/questions/:questionId/draft
 * Optional: autosave user selection before reveal.
 */
export async function saveDraft(
  sessionId: number,
  questionId: number,
  selectedAnswerIds: number[],
) {
  try {
    const response = await api.post(
      `/session/${sessionId}/questions/${questionId}/draft`,
      { selectedAnswerIds },
      { headers: await authHeaders() },
    );
    return { status: true, response: response.data };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}

/**
 * POST /session/:id/restart
 * Resets a session back to its initial state (same questions, cleared answers).
 */
export async function restartSession(id: number) {
  try {
    const response = await api.post(
      `/session/${id}/restart`,
      {},
      { headers: await authHeaders() },
    );
    return { status: true, response: response.data };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message:
        error.response?.data?.message ??
        "Failed to restart session. Please try again.",
    };
  }
}
