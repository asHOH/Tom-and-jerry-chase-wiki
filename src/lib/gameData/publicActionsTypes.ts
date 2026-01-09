export type PublicActionRow = {
  id: string;
  entity_type: string;
  /** Raw JSON from DB; validate before applying. */
  entry: unknown;
  created_at: string;
};
