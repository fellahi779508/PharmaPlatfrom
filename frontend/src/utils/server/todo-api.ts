"use server";

import { api } from "../api";
import { CreateTodo, UpdateTodo } from "../types/todo.types";
import { GetToken } from "./auth-api";
import { getLanguage } from "./lang-api";

export async function createTodo(data: CreateTodo) {
  try {
    const response = await api.post("/todo", data, {
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

export async function getTodos() {
  try {
    const response = await api.get("/todo", {
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

export async function getTodo(id: number) {
  try {
    const response = await api.get(`/todo/${id}`, {
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

export async function getTodoListsOfUser() {
  try {
    const response = await api.get("/todo/user/me", {
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

export async function updateTodo(id: number, data: UpdateTodo) {
  try {
    const response = await api.patch(`/todo/${id}`, data, {
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

export async function deleteTodo(id: number) {
  try {
    const response = await api.delete(`/todo/${id}`, {
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
