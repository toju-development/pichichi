/**
 * Tournament detail screen rendered inside the Groups stack.
 *
 * Re-exports the same component used by the Tournaments tab so that
 * navigating to a tournament from a group detail keeps the back button
 * within the Groups stack (instead of jumping to the Tournaments tab).
 */

export { default } from '../../tournaments/[slug]';
