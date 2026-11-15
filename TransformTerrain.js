"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformTerrain = exports.COMPLETE = void 0;
const DelayedAction_1 = require("@civ-clone/core-unit/DelayedAction");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const MovementCost_1 = require("@civ-clone/core-unit/Rules/MovementCost");
const TransformingTerrain_1 = require("./Rules/TransformingTerrain");
const conversion_1 = require("./lib/conversion");
const registerDelayedAction_1 = require("@civ-clone/core-unit/registerDelayedAction");
exports.COMPLETE = 'base-unit-action-transform-terrain:complete';
/**
 * Changes the unit's own tile's terrain to what the `TerrainConversion` rules say it becomes by a `'transform'`. The
 *  work takes as many turns as the largest `MovementCost` answer for this action, divided by the unit's `WorkRate` (see
 *  `DelayedAction`).
 *
 * The result is looked up when the work finishes, not when it starts, so nothing chosen at the start has to be saved:
 *  a unit part-way through this is rebuilt from the unit alone after a load.
 */
class TransformTerrain extends DelayedAction_1.default {
    perform() {
        const [moveCost] = this.ruleRegistry()
            .process(MovementCost_1.default, this.unit(), this)
            .sort((a, b) => b - a);
        super.perform(moveCost || 0, exports.COMPLETE, TransformingTerrain_1.default);
        this.ruleRegistry().process(Moved_1.default, this.unit(), this);
    }
    /**
     * What finishing does: the tile the action was performed on gets a new terrain of the type the action's rule
     *  registry converts it to, through `Tile.setTerrain` (so the tile's `TerrainChanged` rules run). With no conversion
     *  for the terrain by then, nothing changes.
     */
    static complete(action) {
        const tile = action.from(), Result = (0, conversion_1.conversionOf)(action.ruleRegistry(), tile.terrain(), TransformTerrain.kind);
        if (Result === undefined) {
            return;
        }
        tile.setTerrain(new Result());
    }
}
exports.TransformTerrain = TransformTerrain;
// The `TerrainConversion` kind this action asks for. Static, so it survives a load (see above) and so a public
//  instance member doesn't make the class unassignable to `Action`.
TransformTerrain.kind = 'transform';
// Registered here, as every delayed action is, so a unit part-way through this can be saved: the save records the
//  identifier and the behaviour stays in this package.
(0, registerDelayedAction_1.default)({
    BusyRule: TransformingTerrain_1.default,
    handler: exports.COMPLETE,
    action: (unit) => new TransformTerrain(unit.tile(), unit.tile(), unit),
    complete: (unit, pendingEffect, action) => TransformTerrain.complete(action),
});
exports.default = TransformTerrain;
//# sourceMappingURL=TransformTerrain.js.map