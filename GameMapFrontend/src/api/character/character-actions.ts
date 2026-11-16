import type { CharacterDto } from "../../model";
import { customInstance } from "../mutator";

export type CharacterLevelUpResult = {
  character: CharacterDto;
  hitDie: number;
  hitPointRoll: number;
};

export const patchApiCharacterIdHp = (
  id: string,
  playerId: string,
  newHp: number,
) =>
  customInstance<{ data: CharacterDto }>(`/api/Character/${id}/hp`, {
    method: "PATCH",
    params: { playerId },
    body: { newHp },
  });

export const postApiCharacterIdLevelUp = (id: string, playerId: string) =>
  customInstance<{ data: CharacterLevelUpResult }>(
    `/api/Character/${id}/level-up`,
    {
      method: "POST",
      params: { playerId },
    },
  );
