import DelayedAction from '@civ-clone/core-unit/DelayedAction';
export declare const COMPLETE = 'base-unit-action-transform-terrain:complete';
/**
 * Changes the unit's own tile's terrain to what the `TerrainConversion` rules say it becomes by a `'transform'`. The
 *  work takes as many turns as the largest `MovementCost` answer for this action, divided by the unit's `WorkRate` (see
 *  `DelayedAction`).
 *
 * The result is looked up when the work finishes, not when it starts, so nothing chosen at the start has to be saved:
 *  a unit part-way through this is rebuilt from the unit alone after a load.
 */
export declare class TransformTerrain extends DelayedAction {
  static readonly kind: string;
  perform(): void;
  /**
   * What finishing does: the tile the action was performed on gets a new terrain of the type the action's rule
   *  registry converts it to, through `Tile.setTerrain` (so the tile's `TerrainChanged` rules run). With no conversion
   *  for the terrain by then, nothing changes.
   */
  static complete(action: TransformTerrain): void;
}
export default TransformTerrain;
