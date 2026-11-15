import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainConversion from '../Rules/TerrainConversion';

/** What `terrain` becomes by a job of `kind`: the first `TerrainConversion` answer that isn't `undefined`. */
export const conversionOf = (
  ruleRegistry: RuleRegistry,
  terrain: Terrain,
  kind: string
): typeof Terrain | undefined =>
  ruleRegistry
    .process(TerrainConversion, terrain, kind)
    .find(
      (result: typeof Terrain | undefined): boolean => result !== undefined
    );

/**
 * A ruleset's conversion table as `TerrainConversion` rules, `<prefix>:terrain/conversion/<kind>/<From's name>`, one per
 *  row, in the table's order: each answers `To` for a terrain that is a `From`, for `kind` only, and declines (through
 *  its criterion) otherwise.
 */
export const terrainConversions = (
  prefix: string,
  kind: string,
  table: [typeof Terrain, typeof Terrain][]
): TerrainConversion[] =>
  table.map(
    ([From, To]: [typeof Terrain, typeof Terrain]): TerrainConversion =>
      new TerrainConversion(
        `${prefix}:terrain/conversion/${kind}/${From.name}`,
        new Criterion(
          (terrain: Terrain, asked: string): boolean =>
            asked === kind && terrain instanceof From
        ),
        new Effect((): typeof Terrain => To)
      )
  );
