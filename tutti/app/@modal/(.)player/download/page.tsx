import { PlayerDownloadEntry } from "@/components/player/PlayerDownloadEntry";

/** `/player`에서 `router.push`로 올 때만 — `@modal` 슬롯에 그려서 플레이어 위에 뜸 */
export default function PlayerDownloadModalInterceptPage() {
  return <PlayerDownloadEntry mode="intercept" />;
}
