# @omnidotdev/garden

## 0.3.0

### Minor Changes

- Add a layout plugin system, so `layout` accepts any registered plugin name
  rather than a fixed set. Two layouts ship beyond the default tree:

  - **Beehive** (`layout="hex"`): packs sprouts into a honeycomb of pointy-top
    hexagonal cells, spiralled out from a centre cell so the hive stays balanced
    and mirror-symmetric at any count.
  - **3D** (`layout="3d"`): an orbitable sphere, imported separately via
    `@omnidotdev/garden/3d` so Three.js never enters the base bundle.

  Sprouts render richer across every layout: emoji and image logos (normalized to
  a consistent size), taglines, and unreleased products teased from a
  `coming_soon` flag as a dimmed, non-interactive cell with a badge.

  Typed relation edges are now hidden behind a toggle rather than always drawn.
  `showRelations` controls it, and the toggle is itself controllable so a host app
  can drive it.

  The graph keeps itself framed, animating back into view on resize and waiting
  for its nodes to be measured before framing a new one.

## 0.2.0

### Minor Changes

- Add typed cross-sprout relation edges. Gardens can now declare an `edges` array
  (`{ source, target, relations, label?, description?, status? }`) describing
  connections that cut across the containment hierarchy. In the expanded view,
  these render as colored, labeled edges between sprouts, with a filterable
  legend grouped by relation type. New `showRelations` and `relationColors` props
  on `<Garden>` control rendering and per-relation colors.

## 0.1.4

### Patch Changes

- [`6b67616`](https://github.com/omnidotdev/garden/commit/6b6761671b8e09bf77546123530158cf1c13806e) Thanks [@hobbescodes](https://github.com/hobbescodes)! - Add LICENSE

## 0.1.3

### Patch Changes

- [`46df614`](https://github.com/omnidotdev/garden/commit/46df614d7849cc404c9db0129a44f185cb2b0a8d) Thanks [@hobbescodes](https://github.com/hobbescodes)! - Update README

## 0.1.2

### Patch Changes

- [`d091f45`](https://github.com/omnidotdev/garden/commit/d091f457a7502b9f05be11e09d6f2f6127466c13) Thanks [@hobbescodes](https://github.com/hobbescodes)! - Update `README`

## 0.1.1

### Patch Changes

- [#20](https://github.com/omnidotdev/garden/pull/20) [`00e3298`](https://github.com/omnidotdev/garden/commit/00e329807807840b946cb38a8107e51e76c7849f) Thanks [@coopbri](https://github.com/coopbri)! - Add `README`

## 0.1.0

### Minor Changes

- [#18](https://github.com/omnidotdev/garden/pull/18) [`cdb0e2c`](https://github.com/omnidotdev/garden/commit/cdb0e2cbcce9aca670946bd9b4f8ed1bfc1663a3) Thanks [@coopbri](https://github.com/coopbri) and [@hobbescodes](https://github.com/hobbescodes)! - Initial release
