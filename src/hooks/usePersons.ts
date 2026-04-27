import { useState } from "react";
import { Person } from "@/types";

/**
 * Custom hook to manage the state and operations of the graph's persons.
 *
 * This hook manages the `persons` array which acts as the core data structure
 * for the relation builder. It provides methods to create, delete, and link
 * nodes (persons) together.
 *
 * @param initialPersons - Initial array of persons to populate the graph with.
 * @returns An object containing the persons array and CRUD operations.
 */
export const usePersons = (initialPersons: Person[] = []) => {
  const [persons, setPersons] = useState<Person[]>(initialPersons);

  /**
   * Adds a new person to the graph.
   * Calculates a unique ID based on the maximum existing ID.
   *
   * @param name - The name of the new person.
   * @param age - The age of the new person.
   * @param avatar - (Optional) URL to the person's avatar image.
   */
  const addPerson = (name: string, age: number, avatar?: string) => {
    // Generate a new ID by finding the max ID and incrementing, or default to 1
    const newId =
      persons.length > 0 ? Math.max(...persons.map((p) => p.id)) + 1 : 1;
    setPersons((prev) => [
      ...prev,
      { id: newId, name, age, avatar, relations: [] },
    ]);
  };

  /**
   * Links a source person to a target person with a specific relation label.
   * Prevents duplicate relations between the exact same source and target.
   *
   * @param sourceId - The ID of the person initiating the relation.
   * @param targetId - The ID of the person receiving the relation.
   * @param relationLabel - Description of the relationship (e.g., "Manager").
   */
  const addRelation = (
    sourceId: number,
    targetId: number,
    relationLabel: string,
  ) => {
    setPersons((prev) =>
      prev.map((person) => {
        if (person.id === sourceId) {
          // Check if relation already exists to avoid duplicates
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

  /**
   * Completely removes a person from the graph.
   * Also cascades the deletion to remove any inbound relations pointing to this person.
   *
   * @param id - The ID of the person to remove.
   */
  const removePerson = (id: number) => {
    setPersons((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p) => ({
          ...p,
          // Remove any relations that point to the deleted person
          relations: p.relations.filter((r) => r.id !== id),
        })),
    );
  };

  /**
   * Removes a specific relationship between two people.
   *
   * @param sourceId - The ID of the person who initiated the relation.
   * @param targetId - The ID of the person who received the relation.
   */
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
