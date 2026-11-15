import TransformTerrain, { COMPLETE } from '../TransformTerrain';
import { conversionOf, terrainConversions } from '../lib/conversion';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import PendingEffectRegistry from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainChanged from '@civ-clone/core-world/Rules/TerrainChanged';
import TerrainConversion from '../Rules/TerrainConversion';
import TerrainFeature from '@civ-clone/core-terrain-feature/TerrainFeature';
import TerrainFeatureRegistry from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import {
  carryFeatures,
  replaceFeatures,
} from '@civ-clone/base-terrain-feature/lib/replaceFeatures';
import Tile from '@civ-clone/core-world/Tile';
import TransformingTerrain from '../Rules/TransformingTerrain';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import Unit from '@civ-clone/core-unit/Unit';
import WorkRate from '@civ-clone/core-unit/Rules/WorkRate';
import World from '@civ-clone/core-world/World';
import { expect } from 'chai';
import transformCriteria from '../lib/criteria';

// Stand-ins for a ruleset's terrain and units.
class Grassland extends Terrain {}
class Hills extends Terrain {}
class Plains extends Terrain {}
class Ocean extends Terrain {}
class Engineers extends Unit {}
class River extends TerrainFeature {}
class Special extends TerrainFeature {}
class Settlers extends Unit {}

// Rows of Civ2's transform column (survey-terrain §1, RULES.TXT @TERRAIN): Grassland → Hills, Hills → Plains. Ocean has
//  no transform.
const table: [typeof Terrain, typeof Terrain][] = [
  [Grassland, Hills],
  [Hills, Plains],
];

describe('TransformTerrain', (): void => {
  const setUp = (terrain: Terrain = new Grassland()) => {
    const ruleRegistry = new RuleRegistry(),
      pendingEffects = new PendingEffectRegistry(),
      turn = new Turn(),
      tile = new Tile(0, 0, terrain, null as unknown as World, ruleRegistry),
      unit = new Engineers(null, new Player(), tile, ruleRegistry),
      changed: [Tile, Terrain, Terrain][] = [];

    turn.set(10);
    unit.moves().set(1);

    ruleRegistry.register(
      ...terrainConversions('test', TransformTerrain.kind, table),
      new TerrainChanged(
        new Effect((changedTile: Tile, from: Terrain, to: Terrain): void => {
          changed.push([changedTile, from, to]);
        })
      )
    );

    const action = new TransformTerrain(
      tile,
      tile,
      unit,
      ruleRegistry,
      turn,
      pendingEffects
    );

    return { action, changed, pendingEffects, ruleRegistry, tile, unit };
  };

  describe('conversionOf', (): void => {
    it('answers the row for the terrain and kind, and nothing for a terrain or kind with no row', (): void => {
      const { ruleRegistry } = setUp();

      expect(conversionOf(ruleRegistry, new Grassland(), 'transform')).to.equal(
        Hills
      );
      expect(conversionOf(ruleRegistry, new Hills(), 'transform')).to.equal(
        Plains
      );
      expect(conversionOf(ruleRegistry, new Ocean(), 'transform')).to.be
        .undefined;
      expect(conversionOf(ruleRegistry, new Grassland(), 'mine')).to.be
        .undefined;
    });

    it('`terrainConversions` gives each row an id under the prefix', (): void => {
      expect(
        terrainConversions('test', 'transform', table).map((rule) => rule.id())
      ).to.deep.equal([
        'test:terrain/conversion/transform/Grassland',
        'test:terrain/conversion/transform/Hills',
      ]);
    });

    it('takes the first answer that is not `undefined`', (): void => {
      const ruleRegistry = new RuleRegistry();

      ruleRegistry.register(
        new TerrainConversion(new Effect((): undefined => undefined)),
        new TerrainConversion(new Effect((): typeof Terrain => Plains)),
        new TerrainConversion(new Effect((): typeof Terrain => Hills))
      );

      expect(conversionOf(ruleRegistry, new Grassland(), 'transform')).to.equal(
        Plains
      );
    });
  });

  describe('transformCriteria', (): void => {
    const offered = (criteria: Criterion[], unit: Unit, to: Tile): boolean =>
      criteria.every((criterion: Criterion): boolean =>
        criterion.validate(unit, to, unit.tile())
      );

    it('is offered to a unit that can transform, on its own tile, where the terrain converts', (): void => {
      const { ruleRegistry, tile, unit } = setUp(),
        criteria = transformCriteria(
          { ruleRegistry },
          (candidate: Unit): boolean => candidate instanceof Engineers
        );

      expect(offered(criteria, unit, tile)).to.true;
    });

    // Civ2: Engineers only (survey-terrain, the Orders table, `unit_cmd_terraform`).
    it('is not offered to a unit that cannot transform', (): void => {
      const { ruleRegistry, tile } = setUp(),
        settlers = new Settlers(null, new Player(), tile, ruleRegistry),
        criteria = transformCriteria(
          { ruleRegistry },
          (candidate: Unit): boolean => candidate instanceof Engineers
        );

      settlers.moves().set(1);

      expect(offered(criteria, settlers, tile)).to.false;
    });

    it('is not offered where the terrain has no conversion, or with no moves left', (): void => {
      const ocean = setUp(new Ocean()),
        grassland = setUp(),
        canTransform = (): boolean => true;

      expect(
        offered(
          transformCriteria({ ruleRegistry: ocean.ruleRegistry }, canTransform),
          ocean.unit,
          ocean.tile
        )
      ).to.false;

      grassland.unit.moves().set(0);

      expect(
        offered(
          transformCriteria(
            { ruleRegistry: grassland.ruleRegistry },
            canTransform
          ),
          grassland.unit,
          grassland.tile
        )
      ).to.false;
    });

    it("adds the ruleset's extra criteria last", (): void => {
      const { ruleRegistry } = setUp(),
        extra = new Criterion((): boolean => false),
        criteria = transformCriteria({ ruleRegistry }, () => true, extra);

      expect(criteria[criteria.length - 1]).to.equal(extra);
    });
  });

  describe('perform', (): void => {
    // Engineers transform Hills (move 2) in 20 turns: `move × transform_time` = 2 × 20 = 40, at 2 a turn (survey-terrain,
    //  the Orders table and the work rate, OpenCiv2 `unit_do_terrain_work`).
    it('takes the `MovementCost` answer divided by the `WorkRate`', (): void => {
      const { action, pendingEffects, ruleRegistry, unit } = setUp(new Hills());

      ruleRegistry.register(
        new MovementCost(
          new Criterion(
            (unit: Unit, action: unknown): boolean =>
              action instanceof TransformTerrain
          ),
          new Effect((): number => 2 * 20)
        ),
        new WorkRate(new Effect((): number => 2))
      );

      action.perform();

      const [pendingEffect] = pendingEffects.getByTarget(unit);

      expect(pendingEffect.handler()).to.equal(COMPLETE);
      expect(pendingEffect.data()).to.deep.equal({ endTurn: '30' });
      expect(unit.busy()).to.instanceof(TransformingTerrain);
      expect(unit.moves().value()).to.equal(0);
    });
  });

  describe('complete', (): void => {
    it("gives the tile its conversion's terrain, through `setTerrain` and the `TerrainChanged` rules", (): void => {
      const { action, changed, tile } = setUp(),
        from = tile.terrain();

      TransformTerrain.complete(action);

      expect(tile.terrain()).to.instanceof(Hills);
      expect(changed).to.deep.equal([[tile, from, tile.terrain()]]);
    });

    it('leaves the terrain alone when nothing converts it', (): void => {
      const { action, changed, tile } = setUp(new Ocean()),
        from = tile.terrain();

      TransformTerrain.complete(action);

      expect(tile.terrain()).to.equal(from);
      expect(changed).to.deep.equal([]);
    });

    // A feature belongs to its `Terrain` instance, so the game's `TerrainChanged` rules move a square's features onto
    //  the new one (base-terrain-feature's `replaceFeatures`; civ2-world registers `civ2-world:terrain-changed/features`).
    describe("with the game's `TerrainChanged` feature rule registered", (): void => {
      const withFeatures = (
        rule: (
          registry: TerrainFeatureRegistry
        ) => (tile: Tile, from: Terrain, to: Terrain) => void
      ) => {
        const set = setUp(),
          terrainFeatureRegistry = new TerrainFeatureRegistry(),
          from = set.tile.terrain();

        terrainFeatureRegistry.register(new River(from), new Special(from));
        set.ruleRegistry.register(
          new TerrainChanged(new Effect(rule(terrainFeatureRegistry)))
        );

        TransformTerrain.complete(set.action);

        return { ...set, from, terrainFeatureRegistry };
      };

      it('carries the features onto the new terrain, leaving none on the old one', (): void => {
        const { from, terrainFeatureRegistry, tile } =
          withFeatures(carryFeatures);

        expect(terrainFeatureRegistry.getByTerrain(from)).to.deep.equal([]);
        expect(
          terrainFeatureRegistry
            .getByTerrain(tile.terrain())
            .map((feature: TerrainFeature) => feature.constructor)
        ).to.deep.equal([River, Special]);
        expect(
          terrainFeatureRegistry
            .entries()
            .every(
              (feature: TerrainFeature): boolean =>
                feature.terrain() === tile.terrain()
            )
        ).to.true;
      });

      it('drops the features the new terrain cannot hold from the registry', (): void => {
        const { from, terrainFeatureRegistry, tile } = withFeatures(
          (registry: TerrainFeatureRegistry) =>
            replaceFeatures(registry, (features, to) =>
              features
                .filter((feature) => feature instanceof River)
                .map((feature) => feature.clone(to))
            )
        );

        expect(terrainFeatureRegistry.getByTerrain(from)).to.deep.equal([]);
        expect(
          terrainFeatureRegistry
            .entries()
            .map((feature: TerrainFeature) => [
              feature.constructor,
              feature.terrain() === tile.terrain(),
            ])
        ).to.deep.equal([[River, true]]);
      });
    });
  });
});
