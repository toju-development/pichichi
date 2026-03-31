/**
 * Group detail screen rendered inside the Tournaments stack.
 *
 * Re-exports the same component used by the Groups tab so that
 * navigating to a group from a tournament detail keeps the back button
 * within the Tournaments stack (instead of jumping to the Groups tab).
 */

export { default } from '../../../(tabs)/groups/[id]';
