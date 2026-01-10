/**
 * Raw JSON from DB; can be a single ActionHistoryEntry or an array of ActionHistoryEntry items.
 * Validate before applying.
 */
export type PublicActionRow = {
  id: string;
  entity_type: string;
  /**
   * Raw JSON from DB; can be:
   * - A single ActionHistoryEntry (Action or Action[])
   * - An array of ActionHistoryEntry items (for batch submissions)
   * Validate before applying.
   */
  entry: unknown;
  created_at: string;
};
