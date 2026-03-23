"use client";

import { useMemo } from "react";

import { useMutation } from "@tanstack/react-query";

import { createProject } from "@api/midi/apis/post/create-project";
import {
  CreateProjectResponseDto,
} from "@api/midi/types/api.types";

import { ApiError } from "@/common/errors/ApiError";

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
  const { tracks, uploadedFile, selectedInstrument, trackMappings } = useMidiStore();

  const instrumentId = useMemo(() => {
    if (!selectedInstrument) return null;

    // InstrumentOrbit은 id를 문자열로 보관하고, INSTRUMENT_OPTIONS는 id(숫자 프로그램 ID)를 보관합니다.
    // 현재 UI의 orbit id: violin | oboe | flute
    //
    // TODO: 악기 옵션(INSTRUMENT_OPTIONS)은 나중에 API로 받게 되면,
    // selectedInstrument와 옵션 간 매핑 로직도 API 응답 기준으로 교체할 예정입니다.
    const orbitToInstrumentId: Record<string, number> = {
      violin: 40,
      oboe: 68,
      flute: 73,
    };

    if (orbitToInstrumentId[selectedInstrument] != null) {
      return orbitToInstrumentId[selectedInstrument];
    }

    // 혹시 UI 값이 label과 직접 매칭되는 경우를 위해 fallback
    const matchedByLabel = INSTRUMENT_OPTIONS.find(
      (opt) => opt.label.toLowerCase() === selectedInstrument.toLowerCase(),
    );
    return matchedByLabel?.id ?? null;
  }, [selectedInstrument]);

  return useMutation<CreateProjectResponseDto, ApiError, void>({
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
        tracks: tracks.map((track, index) => ({
          trackIndex: index,
          sourceInstrumentId: track.sourceInstrumentId,
        })),
        mappings: tracks.map((track, index) => ({
          trackIndex: index,
          targetInstrumentId:
            trackMappings[track.id] ?? track.sourceInstrumentId,
        })),
      };

      return createProject({
        file: uploadedFile,
        request: requestPayload,
      });
    },
  });
};

