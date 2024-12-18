"use client";

import { getUserInfoFromCookies, UserInfo } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userInfo = getUserInfoFromCookies();
    if (userInfo) {
      router.push("/dashboard/");
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return <></>;
}
