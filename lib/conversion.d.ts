import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainConversion from '../Rules/TerrainConversion';
/** What `terrain` becomes by a job of `kind`: the first `TerrainConversion` answer that isn't `undefined`. */
export declare const conversionOf: (
  ruleRegistry: RuleRegistry,
  terrain: Terrain,
  kind: string
) => typeof Terrain | undefined;
/**
 * A ruleset's conversion table as `TerrainConversion` rules, `<prefix>:terrain/conversion/<kind>/<From's name>`, one per
 *  row, in the table's order: each answers `To` for a terrain that is a `From`, for `kind` only, and declines (through
 *  its criterion) otherwise.
 */
export declare const terrainConversions: (
  prefix: string,
  kind: string,
  table: [typeof Terrain, typeof Terrain][]
) => TerrainConversion[];
