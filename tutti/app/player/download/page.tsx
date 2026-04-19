import { PlayerDownloadEntry } from "@/components/player/PlayerDownloadEntry";
import ProtectedRoute from "@/components/common/ProtectedRoute";

/** `/player/download` 직접 진입·새로고침 시 전체 화면으로 모달 */
export default function PlayerDownloadPage() {
  return (
    <ProtectedRoute>
      <PlayerDownloadEntry mode="full" />
    </ProtectedRoute>
  );
}
