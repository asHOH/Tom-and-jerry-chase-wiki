# Third-party icon notices

This file records the provenance of third-party SVG geometry vendored into the source tree. Paths may be reformatted for JSX, have equivalent SVG commands normalized, or be composed through the local `SvgIcon` wrapper. Unless a row says otherwise, the artwork remains governed by its upstream license.

Project-specific SVG artwork, charts, connectors, maps, and other visualizations are not third-party notices and are outside this file's scope.

## Heroicons

- Author: Refactoring UI Inc. / Tailwind Labs, Inc.
- Upstream: <https://github.com/tailwindlabs/heroicons>
- License: MIT
- Pinned revisions:
  - v1.0.6: [`71b15b9e72e0211c5dbb28fb75f280deedaec28d`](https://github.com/tailwindlabs/heroicons/tree/71b15b9e72e0211c5dbb28fb75f280deedaec28d)
  - current 24 px set used by later additions: [`616b7a4dbbf3d011760af8066262cd5c6b3868f3`](https://github.com/tailwindlabs/heroicons/tree/616b7a4dbbf3d011760af8066262cd5c6b3868f3)

The following local components contain Heroicons geometry. Every right-hand path is relative to the pinned revision named for that group.

### `src/components/icons/CommonIcons.tsx`

v1.0.6 mappings:

- `CloseIcon` → `optimized/outline/x.svg`
- `ChevronLeftIcon` → `optimized/outline/chevron-left.svg`
- `ChevronRightIcon` → `optimized/outline/chevron-right.svg`
- `ChevronDownIcon` → `optimized/outline/chevron-down.svg`
- `ChevronUpIcon` → `optimized/outline/chevron-up.svg`
- `ChevronRightSolidIcon` → `optimized/solid/chevron-right.svg`
- `SearchIcon` → `optimized/outline/search.svg`
- `CheckIcon` → `optimized/outline/check.svg`
- `ChatBubbleIcon` → `optimized/outline/chat.svg`
- `UserIcon` → `optimized/outline/user.svg`
- `ArrowPathIcon` → `optimized/outline/refresh.svg`
- `DocumentTextIcon` → `optimized/outline/document-text.svg`
- `CalendarIcon` → `optimized/outline/calendar.svg`
- `LockClosedIcon` → `optimized/outline/lock-closed.svg`
- `ShareIcon` → `optimized/outline/share.svg`
- `SparklesIcon` → `optimized/outline/sparkles.svg`
- `XCircleSolidIcon` → `optimized/solid/x-circle.svg`

Pinned current revision mappings:

- `PlusIcon` → `optimized/24/outline/plus.svg`
- `TrashIcon` → `optimized/24/outline/trash.svg`
- `UserCircleIcon` → `optimized/24/outline/user-circle.svg`
- `HomeIcon` → `optimized/24/outline/home.svg`
- `GlobeIcon` → `optimized/24/outline/globe-alt.svg`
- `FolderIcon` → `optimized/24/outline/folder.svg`
- `ClockIcon` → `optimized/24/outline/clock.svg`
- `EyeIcon` → `optimized/24/outline/eye.svg`
- `PencilSquareIcon` → `optimized/24/outline/pencil-square.svg`
- `ArrowTopRightOnSquareIcon` → `optimized/24/outline/arrow-top-right-on-square.svg`
- `ArrowUpTrayIcon` → `optimized/24/outline/arrow-up-tray.svg`
- `ArrowLeftOnRectangleIcon` → `optimized/24/outline/arrow-turn-down-left.svg`
- `InformationCircleIcon` → `optimized/24/outline/information-circle.svg`
- `ExclamationTriangleIcon` → `optimized/24/outline/exclamation-triangle.svg`
- `XCircleIcon` → `optimized/24/outline/x-circle.svg`

### `src/components/ui/RichTextEditorIcons.tsx`

v1.0.6 mappings:

- `LinkIcon` → `optimized/outline/link.svg`
- `ImageIcon` → `optimized/outline/photograph.svg`
- `UndoIcon` → `optimized/outline/reply.svg`

Pinned current revision mappings:

- `BoldIcon` → `optimized/24/outline/bold.svg`
- `ItalicIcon` → `optimized/24/outline/italic.svg`
- `BulletListIcon` → `optimized/24/outline/list-bullet.svg`
- `OrderedListIcon` → `optimized/24/outline/numbered-list.svg`

Some local names reflect their use rather than the upstream filename. Geometry may also have equivalent SVG command formatting, such as explicit spaces or arc flags.

### Heroicons MIT license

MIT License

Copyright (c) 2020 Refactoring UI Inc.

Copyright (c) Tailwind Labs, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Feather Icons

- Author: Cole Bemis
- Upstream: <https://github.com/feathericons/feather>
- Pinned revision: [`3dc050d97405062eba78aa57115c0a15c63abdaa`](https://github.com/feathericons/feather/tree/3dc050d97405062eba78aa57115c0a15c63abdaa)
- License: MIT
- Local file: `src/components/icons/CommonIcons.tsx`
- Local components and sources:
  - `SunIcon`: `icons/sun.svg`
  - `MoonIcon`: `icons/moon.svg`
  - `TargetIcon`: `icons/target.svg`

The local JSX consolidates some `<line>` elements into equivalent path commands.

### Feather Icons MIT license

MIT License

Copyright (c) 2013-2023 Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Brand icons

The following brand marks appear only as links to the represented services. Their inclusion does not imply endorsement, affiliation, or ownership of the corresponding trademarks.

| Local component                                                | Upstream project and author | Pinned source                                                                                                                                                                                     | License                                                                                                                                                 |
| -------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WeiboIcon` in `src/components/ui/ExternalLinksDisplay.tsx`    | CoreUI Icons by CoreUI      | [`88d1cfc47fc3cc84114de2a01b04db11a941bdf9/svg/brand/cib-sina-weibo.svg`](https://github.com/coreui/coreui-icons/blob/88d1cfc47fc3cc84114de2a01b04db11a941bdf9/svg/brand/cib-sina-weibo.svg)      | CC0 1.0 under the upstream Brand Icons and Flags section; the Sina Weibo mark remains subject to its owner's trademark rights                           |
| `BilibiliIcon` in `src/components/ui/ExternalLinksDisplay.tsx` | Remix Icon by Remix Design  | [`dbd9742407d04841dfc8c5b9672ca4f02bdf7dae/icons/Logos/bilibili-fill.svg`](https://github.com/Remix-Design/RemixIcon/blob/dbd9742407d04841dfc8c5b9672ca4f02bdf7dae/icons/Logos/bilibili-fill.svg) | Apache License 2.0 at the pinned revision; see `third-party/licenses/Apache-2.0.txt`. The Bilibili mark remains subject to its owner's trademark rights |
| `FandomIcon` in `src/components/ui/ExternalLinksDisplay.tsx`   | Simple Icons contributors   | [`34c22501f9ac9f22b12f825677ccbab1fb22e14b/icons/fandom.svg`](https://github.com/simple-icons/simple-icons/blob/34c22501f9ac9f22b12f825677ccbab1fb22e14b/icons/fandom.svg)                        | CC0 1.0; the Fandom mark remains subject to its owner's trademark rights                                                                                |

## Unresolved provenance

`NeteaseGameIcon` in `src/components/ui/ExternalLinksDisplay.tsx` was introduced by repository commit [`bab0185938d47d60a260211a1313184f42800a32`](https://github.com/asHOH/tom-and-jerry-chase-wiki/commit/bab0185938d47d60a260211a1313184f42800a32), but that commit and its history do not record an upstream asset URL, author, revision, or license. Treat it as an unverified NetEase Game trademark asset: use it only to identify and link to the corresponding official service, and do not reuse or redistribute it independently until an authoritative source is recorded.

## Maintenance

When adding or replacing vendored icon geometry:

1. Record the upstream repository, exact commit, source path, author, and license here in the same change.
2. Preserve any required copyright, permission, attribution, and license text.
3. Keep brand marks limited to identifying or linking to their respective owners.
4. Do not describe an icon as third-party unless its geometry has been verified against the pinned source.
