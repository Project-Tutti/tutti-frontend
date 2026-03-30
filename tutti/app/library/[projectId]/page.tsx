import { Suspense } from "react";

import ProjectVersionsScreen from "@/components/library/ProjectVersionsScreen";
import { Spinner } from "@/components/common/Spinner";

function VersionsFallback() {
  return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
      <Spinner size="md" label="불러오는 중…" />
    </div>
  );
}

export default function LibraryProjectVersionsPage() {
  return (
    <Suspense fallback={<VersionsFallback />}>
      <ProjectVersionsScreen />
    </Suspense>
  );
}
