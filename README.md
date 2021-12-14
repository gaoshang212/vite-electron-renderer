# vite-electron-renderer

[![npm version](https://badge.fury.io/js/vite-electron-renderer.svg)](https://badge.fury.io/js/vite-electron-renderer)
<br>
Provides electron renederer externals support for Vite.
<br>

将使用 improt from 导入的 electron、node and dependencies 模块，转换成 require方式

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

## Principe | 原理
convert "import from" to "require" for node Modules. include builtinModules, and project dependencies.
将使用 improt from 导入的 electron、node and dependencies 模块，转换成 require方式

## 参考
[vite-plugin-commonjs-externals](https://github.com/xiaoxiangmoe/vite-plugin-commonjs-externals)
[vitejs-plugin-electron](https://github.com/caoxiemeihao/vite-plugins/tree/main/packages/electron)
