export type Relation = {
  id: number;
  relation: string;
};

export type Person = {
  id: number;
  name: string;
  age: number;
  avatar?: string;
  relations: Relation[];
};
