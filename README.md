# vite-electron-renderer

[![npm version](https://badge.fury.io/js/vite-electron-renderer.svg)](https://badge.fury.io/js/vite-electron-renderer)
<br>
Provides electron renederer externals support for Vite.

## Installation

Using npm:

```shell
$ npm install --save-dev vite-electron-renderer
```

## Example

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electronRenderer from 'vite-electron-renderer';

export default defineConfig({
    ...
     plugins: [react(), electronRenderer()],
    ...
});
```

## How to work
convert import to require for node Modules. include builtinModules, and project dependencies.

