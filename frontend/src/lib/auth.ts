/**
 * Auth types for Axiom Dashboard
 */
export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
};

export type User = {
  id: string;
  email: string;
  name: string;
};
