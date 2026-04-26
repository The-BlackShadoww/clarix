import { MIRO_PASTELS, NODE_SIZE } from "@/constants";

/**
 * Generates a consistent color based on a string (e.g. name).
 * @param name - The string to hash for color generation.
 * @returns A hex color string from the MIRO_PASTELS palette.
 */
export const getColorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MIRO_PASTELS[Math.abs(hash) % MIRO_PASTELS.length];
};

/**
 * Returns the size of the node. Currently uniform, but could scale by age.
 * @param age - The age of the person.
 * @returns The pixel size of the node.
 */
export const getSizeFromAge = (_age: number): number => {
  return NODE_SIZE;
};
