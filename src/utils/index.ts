import { MIRO_PASTELS, NODE_SIZE } from "@/constants";

/**
 * Generates a consistent, deterministic pastel color based on a string (e.g., a person's name).
 * This ensures that a node with the same name always gets the same color.
 * 
 * @param name - The string to hash for color generation.
 * @returns A hex color string from the pre-defined MIRO_PASTELS palette.
 */
export const getColorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MIRO_PASTELS[Math.abs(hash) % MIRO_PASTELS.length];
};

/**
 * Returns the visual size of a node based on the person's age.
 * Currently, it returns a uniform size (NODE_SIZE) for all nodes,
 * but this function acts as a centralized place to add scaling logic in the future.
 * 
 * @param _age - The age of the person (currently unused, kept for future scaling logic).
 * @returns The pixel size of the node.
 */
export const getSizeFromAge = (_age: number): number => {
  return NODE_SIZE;
};
