"use server";

import { api } from "../api";
import { CreateCourse } from "../types/course.types";
import { GetToken } from "./auth-api";
import { getLanguage } from "./lang-api";

export async function createCourse(data: CreateCourse) {
  try {
    const response = await api.post("/course", data, {
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

export async function getCourses() {
  try {
    const response = await api.get("/course", {
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

export async function getCourse(id: number) {
  try {
    const response = await api.get(`/course/${id}`, {
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

export async function updateCourse(id: number, data: CreateCourse) {
  try {
    const response = await api.patch(`/course/${id}`, data, {
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

export async function deleteCourse(id: number) {
  try {
    const response = await api.delete(`/course/${id}`, {
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

export async function getSubjectWithContent(subjectId: number) {
  try {
    const response = await api.get(`/subject/${subjectId}`, {
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

export async function getCoursesBySubject(subjectId: number) {
  try {
    const response = await api.get(`/course/subject/${subjectId}`, {
      headers: {
        "Accept-Language": await getLanguage(),
        Authorization: `Bearer ${await GetToken()}`,
      },
    });
    console.log("get", response.data);

    return { status: true, response: response.data };
  } catch (error: any) {
    console.log(error);
    return {
      status: false,
      message: error.response?.data?.message,
    };
  }
}
