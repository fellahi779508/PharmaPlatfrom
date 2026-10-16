"use server";

import { api } from "../api";
import {
  CreateRoomDto,
  Room,
  LeaderboardEntry,
  ApiResponse,
} from "../types/room.types";
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
// Room CRUD
// ---------------------------------------------------------------------------

/**
 * POST /room
 * Create a new private room (host only).
 * Returns room with the join code.
 */
export async function createRoom(data: CreateRoomDto) {
  try {
    const response = await api.post("/room", data, {
      headers: await authHeaders(),
    });
    return { status: true, response: response.data as Room };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message:
        error.response?.data?.message ??
        "Failed to create room. Please try again.",
    };
  }
}

/**
 * GET /room/code/:code
 * Look up a room by its join code (before joining via socket).
 */
export async function findRoomByCode(code: string) {
  try {
    const response = await api.get(`/room/code/${code}`, {
      headers: await authHeaders(),
    });
    return { status: true, response: response.data as Room };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message: error.response?.data?.message ?? "Room not found",
    };
  }
}

/**
 * GET /room/:id
 * Get a room by its UUID.
 */
export async function findRoomById(id: string) {
  try {
    const response = await api.get(`/room/${id}`, {
      headers: await authHeaders(),
    });
    return { status: true, response: response.data as Room };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message: error.response?.data?.message ?? "Room not found",
    };
  }
}

/**
 * GET /room/:id/leaderboard
 * Get final leaderboard (after game ends).
 */
export async function getRoomLeaderboard(id: string) {
  try {
    const response = await api.get(`/room/${id}/leaderboard`, {
      headers: await authHeaders(),
    });
    return { status: true, response: response.data as LeaderboardEntry[] };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message: error.response?.data?.message ?? "Failed to get leaderboard",
    };
  }
}

/**
 * DELETE /room/:id/player
 * Self-leave a room via HTTP (alternative to socket leave_room).
 */
export async function leaveRoom(id: string) {
  try {
    const response = await api.delete(`/room/${id}/player`, {
      headers: await authHeaders(),
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message: error.response?.data?.message ?? "Failed to leave room",
    };
  }
}

/**
 * DELETE /room/:id
 * Delete a room (host only). Cascades to session/exam.
 */
export async function deleteRoom(id: string) {
  try {
    const response = await api.delete(`/room/${id}`, {
      headers: await authHeaders(),
    });
    return { status: true, response: response.data };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message: error.response?.data?.message ?? "Failed to delete room",
    };
  }
}
