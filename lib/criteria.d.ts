import Criterion from '@civ-clone/core-rule/Criterion';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
/**
 * The criteria for transforming the unit's own tile, in order: moves left, the current tile, `canTransform` (which units
 *  may: Engineers, in Civ2), a `TerrainConversion` answer for the tile's terrain and `TransformTerrain.kind`, then the
 *  ruleset's `extra` criteria, as they are. Asking for the conversion here means the action is offered only where
 *  finishing it would change the terrain.
 */
export declare const transformCriteria: (
  {
    ruleRegistry,
  }: {
    ruleRegistry: RuleRegistry;
  },
  canTransform: (unit: Unit) => boolean,
  ...extra: Criterion[]
) => Criterion[];
export default transformCriteria;
