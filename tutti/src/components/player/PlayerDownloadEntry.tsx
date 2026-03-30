"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import DownloadFormatModal from "@/components/player/DownloadFormatModal";
import { Spinner } from "@/components/common/Spinner";

type PlayerDownloadEntryMode = "intercept" | "full";

function PlayerDownloadEntryInner({ mode }: { mode: PlayerDownloadEntryMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const versionId = searchParams.get("versionId");

  useEffect(() => {
    if (mode === "full" && (!projectId || !versionId)) {
      router.replace("/player");
    }
  }, [mode, projectId, versionId, router]);

  if (!projectId || !versionId) {
    if (mode === "intercept") {
      return null;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
        <Spinner size="md" />
      </div>
    );
  }

  const onClose =
    mode === "intercept"
      ? () => router.back()
      : () => router.push("/player");

  const modal = (
    <DownloadFormatModal
      projectId={projectId}
      versionId={versionId}
      onClose={onClose}
    />
  );

  if (mode === "intercept") {
    return modal;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] p-4">
      {modal}
    </div>
  );
}

const suspenseFallback = (mode: PlayerDownloadEntryMode) =>
  mode === "intercept" ? (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      <Spinner size="md" />
    </div>
  ) : (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
      <Spinner size="md" />
    </div>
  );

export function PlayerDownloadEntry({ mode }: { mode: PlayerDownloadEntryMode }) {
  return (
    <Suspense fallback={suspenseFallback(mode)}>
      <PlayerDownloadEntryInner mode={mode} />
    </Suspense>
  );
}
