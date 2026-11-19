<img src="icon.png" alt="Botslab" align="left" width="64" height="64" style="margin-right: 16px;">

# Botslab Vacuum Map Card

A modern, high-performance Home Assistant Lovelace card for controlling Botslab & 360 robot vacuums. Built with React 19, TypeScript, and SCSS.

Adapted from [`dreame-vacuum-map-card`](https://github.com/noambergauz/dreame-vacuum-map-card) by Noam Bergauz under the MIT License.

<br clear="left">

---

## Features

- **Live Interactive Map:** Real-time map rendering with zoom, pan, and smooth touch controls.
- **Cleaning Modes:** Full support for **All (Whole House)**, **Room (Area/Segment)**, and **Zone (Custom Box)** cleaning modes.
- **Per-Room Selection & Ordering:** Select specific rooms on the map or in list view, with configurable execution sequence.
- **No-Go & No-Mop Overlays:** Visual rendering and interactive management of restricted zones and virtual walls directly on the dashboard.
- **Dock & Station Popup:** Live telemetry for dock status, consumables, dustbin emptying, and base station operations.
- **Dynamic Layout:** Responsive column layout on mobile screens and wide landscape view on tablets and wall-mounted dashboards.
- **Native Theming:** Automatically inherits your active Home Assistant theme (light, dark, and custom themes).
- **Bilingual Internationalization (i18n):** Full support for **English (en)** and **Turkish (Türkçe - tr)** with automatic language detection.

---

## Installation & Distribution

This frontend card is bundled directly with the [Botslab Vacuum Home Assistant Integration](https://github.com/srg-n/ha-botslab-vacuum).

### Automatic Registration
When the integration is loaded, the compiled card bundle is automatically registered and served via Home Assistant's static path:
```
/botslab_vacuum/botslab-vacuum-map-card.js
```

No manual resource registration is required when using HACS or manual integration installation.

---

## Dashboard Configuration

Add the card to your Lovelace dashboard (UI editor or YAML):

```yaml
type: custom:botslab-vacuum-map-card
entity: vacuum.botslab_s8_vacuum
title: Botslab Vacuum
map_entity: camera.botslab_s8_cleaning_map   # Optional: defaults to the vacuum's map camera
language: auto                              # Optional: 'auto', 'en', or 'tr'
default_mode: all                           # Optional: 'all', 'room', or 'zone'
default_room_view: map                      # Optional: 'map' (default) or 'list'
map_height: 520px                           # Optional: custom CSS height cap
map_overlays:
  - room_labels
  - vacuum
  - charger
```

### Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `entity` | `string` | **Required** | The entity ID of the vacuum (e.g. `vacuum.oturma_odasi_botslab_s8`). |
| `title` | `string` | Optional | Card title displayed in the header. |
| `map_entity` | `string` | Optional | Companion camera entity providing live raster map and calibration telemetry. |
| `language` | `string` | `auto` | UI language (`auto`, `en`, or `tr`). |
| `default_mode` | `string` | `all` | Initial cleaning mode tab: `all`, `room`, or `zone`. |
| `default_room_view` | `string` | `map` | Mode for room selection: `map` (interactive segments) or `list`. |
| `map_height` | `string` | `auto` | Maximum height of the map element (e.g. `450px`, `60vh`). |
| `room_names` | `map` | Optional | Custom room name overrides mapping segment IDs or vendor names to display labels. |

---

## Development & Build Setup

The card source code is fully reviewable and rebuildable from this directory.

### Prerequisites
- **Node.js**: `20.x` or newer (LTS recommended)
- **npm**: `10.x` or newer

### 1. Install Dependencies
```bash
cd card
npm install
```

### 2. Build the Card
Compile TypeScript and build the minified production bundle with Vite:
```bash
npm run build
```
The compiled single-file ES module bundle will be generated at:
```
card/dist/botslab-vacuum-map-card.js
```

### 3. Build & Sync with Integration
To build the bundle and immediately copy it into the Home Assistant integration's web directory (`custom_components/botslab_vacuum/www/`):
```bash
npm run build:copy
```

### 4. Development Server
Start the local Vite development server with hot module replacement:
```bash
npm run dev
```

### 5. Code Quality & Testing
- **Linting:**
  ```bash
  npm run lint
  npm run lint:scss
  ```
- **Formatting:**
  ```bash
  npm run format:check
  ```
- **Unit Tests:**
  ```bash
  npm run test:run
  ```

---

## Tech Stack

- **React 19**
- **TypeScript 5.9**
- **Vite 7** (Library mode with single-file ES module bundling)
- **SASS / SCSS**
- **Lucide React** (Icons)
- **Vitest** (Unit test suite)

---

## Upstream Attribution & License

- Original implementation: [`dreame-vacuum-map-card`](https://github.com/noambergauz/dreame-vacuum-map-card) by **Noam Bergauz**.
- Licensed under the **MIT License**.
- Full copyright and permission notice is available in the [`LICENSE`](LICENSE) file and in [`custom_components/botslab_vacuum/www/THIRD_PARTY.md`](../custom_components/botslab_vacuum/www/THIRD_PARTY.md).
