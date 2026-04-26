import { useState } from "react";
import { Person } from "@/types";

export const usePersons = (initialPersons: Person[] = []) => {
  const [persons, setPersons] = useState<Person[]>(initialPersons);

  const addPerson = (name: string, age: number, avatar?: string) => {
    const newId =
      persons.length > 0 ? Math.max(...persons.map((p) => p.id)) + 1 : 1;
    setPersons((prev) => [
      ...prev,
      { id: newId, name, age, avatar, relations: [] },
    ]);
  };

  const addRelation = (
    sourceId: number,
    targetId: number,
    relationLabel: string,
  ) => {
    setPersons((prev) =>
      prev.map((person) => {
        if (person.id === sourceId) {
          const exists = person.relations.some((r) => r.id === targetId);
          if (exists) return person;
          return {
            ...person,
            relations: [
              ...person.relations,
              { id: targetId, relation: relationLabel },
            ],
          };
        }
        return person;
      }),
    );
  };

  const removePerson = (id: number) => {
    setPersons((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p) => ({
          ...p,
          relations: p.relations.filter((r) => r.id !== id),
        })),
    );
  };

  const removeRelation = (sourceId: number, targetId: number) => {
    setPersons((prev) =>
      prev.map((p) => {
        if (p.id === sourceId) {
          return {
            ...p,
            relations: p.relations.filter((r) => r.id !== targetId),
          };
        }
        return p;
      }),
    );
  };

  return {
    persons,
    addPerson,
    addRelation,
    removePerson,
    removeRelation,
  };
};
