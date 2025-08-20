"use client";

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/catalog");
  return null;
}
