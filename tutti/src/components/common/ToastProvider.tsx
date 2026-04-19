"use client";

import dynamic from "next/dynamic";

const ToastContainer = dynamic(
  () => import("@/components/common/Toast").then((m) => m.ToastContainer),
  { ssr: false }
);

export default function ToastProvider() {
  return <ToastContainer />;
}
