# @omnidotdev/garden

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
