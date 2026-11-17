import { useEffect, useState, type FormEvent } from "react";
import TextInput from "../atoms/TextInput";
import Button from "../atoms/Button";
import Modal from "../atoms/Modal";
import {
  usePostApiCharacter,
  useGetApiCompendiumClasses,
  useGetApiCompendiumRaces,
} from "../../api";
import type {
  CreateCharacterDto,
  CompendiumClassDto,
  CompendiumRaceDto,
} from "../../model";
import Dropdown from "../atoms/Dropdown";

import TokenImagePicker from "./TokenImagePicker";


type Props = {
  sessionId: string;
  playerId: string;
  onCreated: () => Promise<void>;
};

export default function CreateCharacterForm({
  sessionId,
  playerId,
  onCreated,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const [name, setName] = useState("");
  const [classIndex, setClassIndex] = useState("");
  const [raceIndex, setRaceIndex] = useState("");
  const [characterPassword, setCharacterPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [error, setError] = useState("");

  const [tokenImage, setTokenImage] = useState<string | null>(null);

  const createCharacter = usePostApiCharacter();

  // Kompendium laden
  const classesQuery = useGetApiCompendiumClasses();
  const racesQuery = useGetApiCompendiumRaces();

  const classes: CompendiumClassDto[] = Array.isArray(classesQuery.data?.data)
    ? classesQuery.data.data
    : [];

  const races: CompendiumRaceDto[] = Array.isArray(racesQuery.data?.data)
    ? racesQuery.data.data
    : [];

  const selectedClass = classes.find((item) => item.index === classIndex);

  const selectedRace = races.find((item) => item.index === raceIndex);

  // Automatische Spielwerte
  const maxHp = selectedClass?.hitDie ?? 10;
  const speedInFeet = selectedRace?.speed ?? 30;

  // Einfache Standardwerte
  const armorClass = 10;

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) return;

    if (!classIndex || !raceIndex) {
      setError("Bitte Klasse und Volk auswählen.");
      return;
    }

    if (characterPassword !== passwordConfirmation) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setError("");

    const character: CreateCharacterDto = {
      gameSessionId: sessionId,
      name: name.trim(),
      ownerPlayerId: playerId,
      tokenImageUrl: tokenImage,
      classIndex,
      raceIndex,
      maxHp,
      armorClass,
      speedInFeet,
      characterPassword,
    };

    try {
      await createCharacter.mutateAsync({
        data: character,
      });

      setName("");
      setClassIndex("");
      setRaceIndex("");
      setCharacterPassword("");
      setPasswordConfirmation("");
      setTokenImage(null);

      await onCreated();
      setIsOpen(false);
    } catch {
      setError("Charakter konnte nicht erstellt werden.");
    }
  };

  return (
    <>
      <Button type="button" variant="primary" onClick={() => setIsOpen(true)}>
        + Charakter hinzufügen
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="wide">
        <h2 className="text-xl font-bold mb-4">Neuen Charakter erstellen</h2>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Charaktername */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Charaktername
            </label>

            <TextInput
              type="text"
              className="mt-1 block w-full rounded-md shadow-sm p-2"
              placeholder="Name deines Charakters..."
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={50}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Klasse */}
            <div>
              <label className="block text-sm font-medium mb-1">Klasse</label>

              <Dropdown
                size="md"
                variant="secondary"
                value={classIndex}
                onChange={(event) => setClassIndex(event.target.value)}
                required
              >
                <option value="">Klasse auswählen</option>

                {classes.map((item) => (
                  <option key={item.index} value={item.index ?? ""}>
                    {item.name}
                  </option>
                ))}
              </Dropdown>
            </div>

            {/* Volk */}
            <div>
              <label className="block text-sm font-medium mb-1">Volk</label>

              <Dropdown
                size="md"
                variant="secondary"
                value={raceIndex}
                onChange={(event) => setRaceIndex(event.target.value)}
                required
              >
                <option value="">Volk auswählen</option>

                {races.map((item) => (
                  <option key={item.index} value={item.index ?? ""}>
                    {item.name}
                  </option>
                ))}
              </Dropdown>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="character-password"
              >
                Charakterpasswort
              </label>
              <TextInput
                id="character-password"
                type="password"
                className="mt-1 block w-full rounded-md shadow-sm p-2"
                placeholder="Passwort eingeben"
                autoComplete="new-password"
                value={characterPassword}
                onChange={(event) => setCharacterPassword(event.target.value)}
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="character-password-confirmation"
              >
                Passwort bestätigen
              </label>
              <TextInput
                id="character-password-confirmation"
                type="password"
                className="mt-1 block w-full rounded-md shadow-sm p-2"
                placeholder="Passwort wiederholen"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) =>
                  setPasswordConfirmation(event.target.value)
                }
                required
              />
            </div>
          </div>
          {/* Token Bild picker*/}
          <div>
            <label className="block text-sm font-medium mb-1">Token-Bild</label>
            <TokenImagePicker value={tokenImage} onChange={setTokenImage} />
          </div>

          {/* Automatische Werte */}
          <div className="rounded border p-3 space-y-2">
            <h3 className="font-semibold">Charakterwerte</h3>

            <div className="flex justify-between">
              <span>Trefferpunkte (HP)</span>
              <strong>{maxHp}</strong>
            </div>

            <div className="flex justify-between">
              <span>Rüstungsklasse (AC)</span>
              <strong>{armorClass}</strong>
            </div>

            <div className="flex justify-between">
              <span>Bewegung</span>
              <strong>{speedInFeet} ft.</strong>
            </div>
          </div>

          {/* Fehler */}
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex justify-between gap-3">
            <Button
              type="button"
              variant="danger"
              onClick={() => setIsOpen(false)}
            >
              Abbrechen
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={
                createCharacter.isPending ||
                !name.trim() ||
                !classIndex ||
                !raceIndex
              }
            >
              {createCharacter.isPending
                ? "Erstelle..."
                : "Charakter erstellen"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
