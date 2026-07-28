/**
 * Hierarchical staff role ranks (higher = more privileged).
 * Aligned with backend {@link ROLE_RANK} in insurances-backend-server.
 */
export const VIEWER_RANK = 1

/** Minimum rank for catalog mutation actions (Editor+). */
export const EDITOR_RANK = 2

/** Minimum rank for permanent catalog deletion (Manager+). Aligned with ROLE_RANK.MANAGER. */
export const MANAGER_RANK = 3

/** Admin rank. Aligned with ROLE_RANK.ADMIN. */
export const ADMIN_RANK = 4
