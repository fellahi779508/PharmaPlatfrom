"use server";

import { api } from "../api";
import { CreateTask, UpdateTask } from "../types/task.types";
import { GetToken } from "./auth-api";
import { getLanguage } from "./lang-api";

export async function createTask(data: CreateTask) {
  try {
    const response = await api.post("/tasks", data, {
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

export async function getTasks() {
  try {
    const response = await api.get("/tasks", {
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

export async function getTask(id: number) {
  try {
    const response = await api.get(`/tasks/${id}`, {
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

export async function getTasksByTodoId(todoId: number) {
  try {
    const response = await api.get(`/tasks/todo/${todoId}`, {
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

export async function updateTask(id: number, data: UpdateTask) {
  try {
    const response = await api.patch(`/tasks/${id}`, data, {
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

export async function deleteTask(id: number) {
  try {
    const response = await api.delete(`/tasks/${id}`, {
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
