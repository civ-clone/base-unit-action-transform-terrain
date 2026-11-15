"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerrainConversion = void 0;
const Rule_1 = require("@civ-clone/core-rule/Rule");
/**
 * What `terrain` becomes when it is converted by a job of `kind` (`'transform'` for `TransformTerrain`), or `undefined`
 *  when this rule has no answer for it. The first answer that isn't `undefined` is the result (`conversionOf`); with
 *  none, the terrain can't be converted that way.
 *
 * The kind is a plain string so one table can hold a ruleset's other conversions too (an irrigation or a mine that
 *  changes the terrain), each looked up by its own kind.
 */
class TerrainConversion extends Rule_1.default {
}
exports.TerrainConversion = TerrainConversion;
exports.default = TerrainConversion;
//# sourceMappingURL=TerrainConversion.js.map