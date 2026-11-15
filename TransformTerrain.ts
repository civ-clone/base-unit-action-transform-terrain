import DelayedAction from '@civ-clone/core-unit/DelayedAction';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import TransformingTerrain from './Rules/TransformingTerrain';
import Unit from '@civ-clone/core-unit/Unit';
import { conversionOf } from './lib/conversion';
import registerDelayedAction from '@civ-clone/core-unit/registerDelayedAction';

export const COMPLETE = 'base-unit-action-transform-terrain:complete';

/**
 * Changes the unit's own tile's terrain to what the `TerrainConversion` rules say it becomes by a `'transform'`. The
 *  work takes as many turns as the largest `MovementCost` answer for this action, divided by the unit's `WorkRate` (see
 *  `DelayedAction`).
 *
 * The result is looked up when the work finishes, not when it starts, so nothing chosen at the start has to be saved:
 *  a unit part-way through this is rebuilt from the unit alone after a load.
 */
export class TransformTerrain extends DelayedAction {
  // The `TerrainConversion` kind this action asks for. Static, so it survives a load (see above) and so a public
  //  instance member doesn't make the class unassignable to `Action`.
  static readonly kind: string = 'transform';

  perform(): void {
    const [moveCost]: number[] = this.ruleRegistry()
      .process(MovementCost, this.unit(), this)
      .sort((a: number, b: number): number => b - a);

    super.perform(moveCost || 0, COMPLETE, TransformingTerrain);

    this.ruleRegistry().process(Moved, this.unit(), this);
  }

  /**
   * What finishing does: the tile the action was performed on gets a new terrain of the type the action's rule
   *  registry converts it to, through `Tile.setTerrain` (so the tile's `TerrainChanged` rules run). With no conversion
   *  for the terrain by then, nothing changes.
   *
   * The square's features are registered against the old `Terrain` instance: the game's `TerrainChanged` rules move
   *  them (base-terrain-feature's `replaceFeatures`), as for every other terrain change, so a game using this action
   *  must register one.
   */
  static complete(action: TransformTerrain): void {
    const tile = action.from(),
      Result = conversionOf(
        action.ruleRegistry(),
        tile.terrain(),
        TransformTerrain.kind
      );

    if (Result === undefined) {
      return;
    }

    tile.setTerrain(new Result());
  }
}

// Registered here, as every delayed action is, so a unit part-way through this can be saved: the save records the
//  identifier and the behaviour stays in this package.
registerDelayedAction({
  BusyRule: TransformingTerrain,
  handler: COMPLETE,
  action: (unit: Unit) => new TransformTerrain(unit.tile(), unit.tile(), unit),
  complete: (unit, pendingEffect, action) => TransformTerrain.complete(action),
});

export default TransformTerrain;
