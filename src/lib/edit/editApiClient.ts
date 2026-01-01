import { entitySnapshotSchema } from '@/lib/validation/schemas';

/**
 * API client abstraction for edit operations.
 * Provides a unified interface for editing any entity type.
 * Currently uses localStorage as the persistence layer;
 * can be extended to support Supabase RPCs or other backends.
 */

export type PersistenceBackend = 'localStorage' | 'supabase' | 'custom';

export interface EditApiConfig {
  backend: PersistenceBackend;
  onBeforePersist?: (entityType: string, path: string, value: unknown) => void;
  onAfterPersist?: (entityType: string, path: string, value: unknown) => void;
  onError?: (error: Error, entityType: string, path: string) => void;
}

/**
 * API client for entity edits.
 * Handles persistence and delegates to entity-specific handlers as needed.
 */
export class EditApiClient {
  private config: EditApiConfig;
  private entityStores: Map<string, Record<string, unknown>> = new Map();

  constructor(config: Partial<EditApiConfig> = {}) {
    this.config = {
      backend: 'localStorage',
      ...config,
    };
  }

  /**
   * Registers an entity store for persistence.
   * @param entityType Name of the entity type
   * @param store The entity store object
   */
  registerStore(entityType: string, store: Record<string, unknown>): void {
    this.entityStores.set(entityType, store);
  }

  /**
   * Edits a property within an entity.
   * @param entityType The type of entity ('character', 'faction', 'knowledgeCard', etc.)
   * @param entityId The ID of the specific entity instance
   * @param path The dot-notation path to the property
   * @param value The new value
   * @returns Promise resolving when the edit is persisted
   */
  async editEntity(
    entityType: string,
    entityId: string,
    path: string,
    value: unknown
  ): Promise<void> {
    try {
      // Call before-persist hook
      if (this.config.onBeforePersist) {
        this.config.onBeforePersist(entityType, path, value);
      }

      // Get the entity store
      const store = this.entityStores.get(entityType);
      if (!store) {
        throw new Error(`No store registered for entity type: ${entityType}`);
      }

      // Get the specific entity
      const entity = store[entityId];
      if (!entity || typeof entity !== 'object') {
        throw new Error(`Entity not found: ${entityType}/${entityId}`);
      }

      // Persist based on configured backend
      switch (this.config.backend) {
        case 'localStorage':
          await this.persistToLocalStorage(entityType, entity as Record<string, unknown>);
          break;
        case 'supabase':
          // TODO: Implement Supabase persistence via RPC
          // await this.persistToSupabase(entityType, entityId, path, value);
          console.warn('Supabase persistence not yet implemented');
          break;
        case 'custom':
          // Custom backends would be implemented by overriding persistToLocalStorage
          // or by providing custom logic in callbacks
          break;
      }

      // Call after-persist hook
      if (this.config.onAfterPersist) {
        this.config.onAfterPersist(entityType, path, value);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (this.config.onError) {
        this.config.onError(err, entityType, path);
      }
      throw err;
    }
  }

  /**
   * Persists an entity to localStorage.
   * @param entityType The entity type name
   * @param entity The entity object to persist
   */
  protected async persistToLocalStorage(
    entityType: string,
    entity: Record<string, unknown>
  ): Promise<void> {
    try {
      localStorage.setItem(entityType, JSON.stringify(entity));
    } catch (error) {
      throw new Error(
        `Failed to persist ${entityType} to localStorage: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Loads an entity from localStorage.
   * @param entityType The entity type name
   * @returns The entity data or undefined if not found
   */
  async loadFromLocalStorage<T = Record<string, unknown>>(
    entityType: string
  ): Promise<T | undefined> {
    try {
      const data = localStorage.getItem(entityType);
      if (!data) return undefined;

      const parsed = entitySnapshotSchema.safeParse(JSON.parse(data));
      if (!parsed.success) {
        throw new Error(
          `Invalid ${entityType} data in localStorage: ${parsed.error.issues
            .map((issue) => issue.message)
            .join(', ')}`
        );
      }
      return parsed.data as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load ${entityType} from localStorage: ${message}`);
    }
  }

  /**
   * Clears an entity from localStorage.
   * @param entityType The entity type name
   */
  async clearFromLocalStorage(entityType: string): Promise<void> {
    try {
      localStorage.removeItem(entityType);
    } catch (error) {
      throw new Error(
        `Failed to clear ${entityType} from localStorage: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * TODO: Implement Supabase RPC persistence.
   * This would call a server-side RPC to persist changes in the database.
   * Requires authentication context and proper RLS policies.
   *
   * @param entityType The entity type
   * @param entityId The entity ID
   * @param path The property path
   * @param value The new value
   */
  protected async persistToSupabase(
    _entityType: string,
    _entityId: string,
    _path: string,
    _value: unknown
  ): Promise<void> {
    throw new Error('Supabase persistence not yet implemented');
  }
}

/**
 * Default global API client instance.
 * Can be configured by the application.
 */
export const defaultEditApiClient = new EditApiClient({
  backend: 'localStorage',
});
