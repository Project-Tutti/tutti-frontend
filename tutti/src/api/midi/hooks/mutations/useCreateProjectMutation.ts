import { useMemo } from "react";

import { useMutation } from "@tanstack/react-query";

import { createProject } from "@api/midi/apis/post/create-project";
import {
  CreateProjectResponseDto,
} from "@api/midi/types/api.types";

import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { INSTRUMENT_OPTIONS } from "@features/midi-create/constants/instrument-options";

// 최초 생성은 v1로 고정 (재생성 API가 분리되어 있기 때문)
const INITIAL_VERSION_NAME = "v1";

/**
 * before-create에서 프로젝트 생성 요청을 보냅니다.
 *
 * - tracks / trackMappings / uploadedFile / selectedInstrument는 Zustand store에서 읽습니다.
 * - mappings은 "아무것도 안 건드리면" 원본과 동일하게 동작하도록 기본값이 들어가 있습니다.
 */

export const useCreateProjectMutation = () => {
  const { tracks, uploadedFile, selectedInstrument, trackMappings, noteRange } = useMidiStore();
  const DROP_CATEGORY_PROGRAM = 129;

  const instrumentId = useMemo(() => {
    if (!selectedInstrument) return null;

    // 홈 궤도: 카테고리 API의 representativeProgram을 문자열 id로 저장
    const n = Number(selectedInstrument);
    if (Number.isFinite(n) && selectedInstrument.trim() !== "") {
      return n;
    }

    // 구버전/로컬스토리지: violin | oboe | flute
    const orbitToInstrumentId: Record<string, number> = {
      violin: 40,
      oboe: 68,
      flute: 73,
    };
    if (orbitToInstrumentId[selectedInstrument] != null) {
      return orbitToInstrumentId[selectedInstrument];
    }

    const matchedByLabel = INSTRUMENT_OPTIONS.find(
      (opt) => opt.label.toLowerCase() === selectedInstrument.toLowerCase(),
    );
    return matchedByLabel?.id ?? null;
  }, [selectedInstrument]);

  return useMutation<CreateProjectResponseDto, Error, void>({
    mutationFn: async () => {
      if (!uploadedFile) {
        throw new Error("MIDI file이 없습니다.");
      }
      if (tracks.length === 0) {
        throw new Error("분석된 tracks가 없습니다.");
      }
      if (instrumentId == null) {
        throw new Error("선택된 악기(instrumentId)가 없습니다.");
      }

      const fileBaseName = uploadedFile.name.replace(/\.[^.]+$/, "");

      const requestPayload = {
        name: fileBaseName || "project",
        versionName: INITIAL_VERSION_NAME,
        instrumentId,
        ...(noteRange && { minNote: noteRange.min, maxNote: noteRange.max }),
        tracks: tracks.map((track, index) => ({
          trackIndex: index,
          sourceInstrumentId: track.sourceInstrumentId,
        })),
        mappings: tracks.map((track, index) => ({
          trackIndex: index,
          targetInstrumentId:
            trackMappings[track.id] ??
            (track.isDropListProgram
              ? DROP_CATEGORY_PROGRAM
              : track.sourceInstrumentId),
        })),
      };

      return createProject({
        file: uploadedFile,
        request: requestPayload,
      });
    },
  });
};

