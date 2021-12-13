# vite-electron-renderer

[![npm version](https://badge.fury.io/js/@gsof%2Fvite-electron-renderer)](https://badge.fury.io/js/@gsof%2Fvite-electron-renderer)
<br>
Provides electron renederer externals support for Vite.

## Installation

Using npm:

```shell
$ npm install --save-dev @gsof/vite-electron-renderer
```

## Example

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electronRenderer from '@gsof/vite-electron-renderer';

export default defineConfig({
    ...
     plugins: [react(), electronRenderer()],
    ...
});
```
