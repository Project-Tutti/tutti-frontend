import { PlayerDownloadEntry } from "@/components/player/PlayerDownloadEntry";

/** `/player/download` 직접 진입·새로고침 시 전체 화면으로 모달 */
export default function PlayerDownloadPage() {
  return <PlayerDownloadEntry mode="full" />;
}
