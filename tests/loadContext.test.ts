import { COMPLETE } from '../TransformTerrain';
import { instance as busyRegistryInstance } from '@civ-clone/core-unit/BusyRegistry';
import PendingEffect from '@civ-clone/core-pending-effect/PendingEffect';
import PendingEffectRegistry from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry, {
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainConversion from '../Rules/TerrainConversion';
import Tile from '@civ-clone/core-world/Tile';
import TransformingTerrain from '../Rules/TransformingTerrain';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import Unit from '@civ-clone/core-unit/Unit';
import World from '@civ-clone/core-world/World';
import { expect } from 'chai';
import { terrainConversions } from '../lib/conversion';

class Grassland extends Terrain {}
class Hills extends Terrain {}
class Plains extends Terrain {}
class Engineers extends Unit {}

// A save loaded into a game with its own registries finishes the job there (civ-clone/web-renderer#248).
describe('TransformTerrain loaded into another game', (): void => {
  it("converts the terrain by the loading game's conversion rules, not the module instance's", (): void => {
    const context = {
        pendingEffects: new PendingEffectRegistry(),
        rules: new RuleRegistry(),
        turn: new Turn(),
      },
      loadingRules = terrainConversions('loading', 'transform', [
        [Grassland, Hills],
      ]),
      instanceRules: TerrainConversion[] = terrainConversions(
        'instance',
        'transform',
        [[Grassland, Plains]]
      ),
      tile = new Tile(0, 0, new Grassland(), null as unknown as World),
      unit = new Engineers(null, new Player(), tile, context.rules);

    context.rules.register(...loadingRules);
    ruleRegistryInstance.register(...instanceRules);

    try {
      context.turn.set(1);
      context.pendingEffects.register(
        new PendingEffect(COMPLETE, unit, { endTurn: '1' })
      );

      const busy = busyRegistryInstance.rebuild(
        'TransformingTerrain',
        unit,
        context
      );

      expect(busy).to.instanceof(TransformingTerrain);

      busy.process();

      expect(tile.terrain()).to.instanceof(Hills);
    } finally {
      ruleRegistryInstance.unregister(...instanceRules);
    }
  });
});
