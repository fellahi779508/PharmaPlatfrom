"use client";
import { GetUserProfile } from "@/utils/server/user-api";
import { useEffect } from "react";

export default function ProfileComponents() {
  useEffect(() => {
    async function fetchProfile() {
      console.log(await GetUserProfile());
    }
    fetchProfile();
  }, []);
  return <div>ProfileComponents</div>;
}
