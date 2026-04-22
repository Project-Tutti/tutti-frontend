import { useMutation } from "@tanstack/react-query";

import { createProject } from "@api/midi/apis/post/create-project";
import type {
  CreateProjectRequestPayloadDto,
  CreateProjectResponseDto,
} from "@api/midi/types/api.types";

import { useMidiStore } from "@features/midi-create/stores/midi-store";

const INITIAL_VERSION_NAME = "v1";

/**
 * before-create에서 프로젝트 생성 요청을 보냅니다.
 *
 * - tracks / trackMappings / uploadedFile / selectedInstrument는 Zustand store에서 읽습니다.
 * - mappings은 "아무것도 안 건드리면" 원본과 동일하게 동작하도록 기본값이 들어가 있습니다.
 */

export const useCreateProjectMutation = () => {
  const {
    tracks,
    uploadedFile,
    selectedInstrument,
    trackMappings,
    noteRange,
    genre,
    projectName,
  } = useMidiStore();

  return useMutation<CreateProjectResponseDto, Error, void>({
    mutationFn: async () => {
      if (!uploadedFile) {
        throw new Error("MIDI file이 없습니다.");
      }
      if (tracks.length === 0) {
        throw new Error("분석된 tracks가 없습니다.");
      }
      if (selectedInstrument == null) {
        throw new Error("선택된 악기(instrumentId)가 없습니다.");
      }
      if (!genre) {
        throw new Error("장르를 선택해주세요.");
      }

      const fileBaseName = uploadedFile.name.replace(/\.[^.]+$/, "");
      const finalName = projectName.trim() || fileBaseName || "project";
      const minNote = noteRange?.min ?? 0;
      const maxNote = noteRange?.max ?? 127;
      const temperature = 1.0;

      const requestPayload: CreateProjectRequestPayloadDto = {
        instrumentId: selectedInstrument,
        genre,
        versionName: INITIAL_VERSION_NAME,
        minNote,
        maxNote,
        mappings: tracks.map((track, index) => ({
          trackIndex: index,
          targetInstrumentId: trackMappings[track.id] ?? track.sourceInstrumentId,
        })),
        tracks: tracks.map((track, index) => ({
          trackIndex: index,
          sourceInstrumentId: track.sourceInstrumentId,
        })),
        name: finalName,
        temperature,
      };

      return createProject({
        file: uploadedFile,
        request: requestPayload,
      });
    },
  });
};
