# base-unit-action-transform-terrain

The `TransformTerrain` unit action: a delayed action that changes the terrain of the unit's own tile to what a lookup
rule says it becomes.

- `TransformTerrain`: `new TransformTerrain(from, to, unit, ruleRegistry?, turn?, pendingEffects?)`. `perform()` starts
  the work, for as many turns as the largest `MovementCost` answer for the action, divided by the unit's `WorkRate`
  (core-unit's `DelayedAction`), and puts the unit in the `TransformingTerrain` busy state. When the work comes due,
  `TransformTerrain.complete(action)` looks up the result and gives the tile a new terrain of that type with
  `Tile.setTerrain`, so the tile's `TerrainChanged` rules run (what happens to specials, irrigation and mines is
  theirs). With no result by then, nothing changes. `TransformTerrain.kind` is `'transform'`.
- `Rules/TerrainConversion`: `TerrainConversion(terrain, kind) → typeof Terrain | undefined`, the lookup. The first
  answer that isn't `undefined` is the result. `kind` is a plain string, so the same table can hold a ruleset's other
  conversions (an irrigation or a mine that changes the terrain), each under its own kind.
- `lib/conversion`: `conversionOf(ruleRegistry, terrain, kind)` asks the lookup, and
  `terrainConversions(prefix, kind, table)` builds one `TerrainConversion` rule per `[From, To]` row of a ruleset's
  table, in order, with the id `<prefix>:terrain/conversion/<kind>/<From's name>`.
- `lib/criteria`: `transformCriteria({ ruleRegistry }, canTransform, ...extra)`, the criteria for the ruleset's
  `Action` rule, in order: moves left, the unit's own tile, `canTransform(unit)` (which units may), a conversion for the
  tile's terrain (so the action is offered only where finishing it changes something), then `extra` as they are.
- `Rules/TransformingTerrain`: the `Busy` rule the unit is in while it works.
- `COMPLETE` (`base-unit-action-transform-terrain:complete`): the handler a save records for work in progress,
  registered with `registerDelayedAction` when the module is loaded, as every delayed action is.

The result is looked up when the work finishes rather than when it starts, so nothing chosen at the start has to be
saved: after a load the action is rebuilt from the unit alone.

A library: it has no `main` and registers no rules.
