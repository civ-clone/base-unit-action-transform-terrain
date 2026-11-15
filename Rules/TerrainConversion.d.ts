import Rule from '@civ-clone/core-rule/Rule';
import Terrain from '@civ-clone/core-terrain/Terrain';
/**
 * What `terrain` becomes when it is converted by a job of `kind` (`'transform'` for `TransformTerrain`), or `undefined`
 *  when this rule has no answer for it. The first answer that isn't `undefined` is the result (`conversionOf`); with
 *  none, the terrain can't be converted that way.
 *
 * The kind is a plain string so one table can hold a ruleset's other conversions too (an irrigation or a mine that
 *  changes the terrain), each looked up by its own kind.
 */
export declare class TerrainConversion extends Rule<
  [Terrain, string],
  typeof Terrain | undefined
> {}
export default TerrainConversion;
