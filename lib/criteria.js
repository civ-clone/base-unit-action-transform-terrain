"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformCriteria = void 0;
const Action_1 = require("@civ-clone/core-unit/Rules/Action");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const TransformTerrain_1 = require("../TransformTerrain");
const conversion_1 = require("./conversion");
/**
 * The criteria for transforming the unit's own tile, in order: moves left, the current tile, `canTransform` (which units
 *  may: Engineers, in Civ2), a `TerrainConversion` answer for the tile's terrain and `TransformTerrain.kind`, then the
 *  ruleset's `extra` criteria, as they are. Asking for the conversion here means the action is offered only where
 *  finishing it would change the terrain.
 */
const transformCriteria = ({ ruleRegistry }, canTransform, ...extra) => [
    Action_1.hasMovesLeft,
    Action_1.isCurrentTile,
    new Criterion_1.default((unit) => canTransform(unit)),
    new Criterion_1.default((unit, to, from = unit.tile()) => (0, conversion_1.conversionOf)(ruleRegistry, from.terrain(), TransformTerrain_1.default.kind) !==
        undefined),
    ...extra,
];
exports.transformCriteria = transformCriteria;
exports.default = exports.transformCriteria;
//# sourceMappingURL=criteria.js.map