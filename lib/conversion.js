"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.terrainConversions = exports.conversionOf = void 0;
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const TerrainConversion_1 = require("../Rules/TerrainConversion");
/** What `terrain` becomes by a job of `kind`: the first `TerrainConversion` answer that isn't `undefined`. */
const conversionOf = (ruleRegistry, terrain, kind) => ruleRegistry
    .process(TerrainConversion_1.default, terrain, kind)
    .find((result) => result !== undefined);
exports.conversionOf = conversionOf;
/**
 * A ruleset's conversion table as `TerrainConversion` rules, `<prefix>:terrain/conversion/<kind>/<From's name>`, one per
 *  row, in the table's order: each answers `To` for a terrain that is a `From`, for `kind` only, and declines (through
 *  its criterion) otherwise.
 */
const terrainConversions = (prefix, kind, table) => table.map(([From, To]) => new TerrainConversion_1.default(`${prefix}:terrain/conversion/${kind}/${From.name}`, new Criterion_1.default((terrain, asked) => asked === kind && terrain instanceof From), new Effect_1.default(() => To)));
exports.terrainConversions = terrainConversions;
//# sourceMappingURL=conversion.js.map