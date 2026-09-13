"use server";

import { api } from "../api";
import { CreateQcmAnswer } from "../types/qcmAnswer.types";
import { GetToken } from "./auth-api";
import { getLanguage } from "./lang-api";

export async function createQcmAnswer(data: CreateQcmAnswer) {
  try {
    const response = await api.post("/qcm-answer", data, {
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

export async function getQcmAnswers() {
  try {
    const response = await api.get("/qcm-answer", {
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

export async function getQcmAnswer(id: number) {
  try {
    const response = await api.get(`/qcm-answer/${id}`, {
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

export async function updateQcmAnswer(
  id: number,
  data: Partial<CreateQcmAnswer>,
) {
  try {
    const response = await api.patch(
      `/qcm-answer/${id}`,
      { ...data, qcmId: undefined },
      {
        headers: {
          "Accept-Language": await getLanguage(),
          Authorization: `Bearer ${await GetToken()}`,
        },
      },
    );
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

export async function deleteQcmAnswer(id: number) {
  try {
    const response = await api.delete(`/qcm-answer/${id}`, {
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
