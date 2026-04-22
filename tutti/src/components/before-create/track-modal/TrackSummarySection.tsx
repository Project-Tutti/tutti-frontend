"use client";

import { MetaList, MetaRow, sectionClass, sectionTitleClass } from "./TrackModalPrimitives";

export function TrackSummarySection({
  trackName,
  trackDisplayType,
  channel,
  noteCount,
  trackId,
  tags,
}: {
  trackName: string;
  trackDisplayType: string;
  channel: number;
  noteCount: number;
  trackId: string;
  tags: string[];
}) {
  return (
    <section className={sectionClass} aria-labelledby="track-summary-heading">
      <h3 id="track-summary-heading" className={sectionTitleClass}>
        요약
      </h3>
      <MetaList>
        <MetaRow label="트랙 이름">
          <span className="font-medium text-white/95">{trackName}</span>
        </MetaRow>
        <MetaRow label="악기 유형">{trackDisplayType}</MetaRow>
        <MetaRow label="채널">{channel}</MetaRow>
        <MetaRow label="음표 수">{noteCount.toLocaleString("ko-KR")}</MetaRow>
        <MetaRow label="트랙 ID">
          <span className="font-mono text-xs text-slate-400">{trackId}</span>
        </MetaRow>
      </MetaList>
      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/6 pt-3">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded border border-white/10 bg-white/4 px-2 py-0.5 text-xs font-medium text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

