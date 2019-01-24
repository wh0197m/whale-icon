import fs = require('fs-extra');
import path = require('path');

import { enviroment } from '../maker/env';
import { make } from '../maker/makeIcons';
import { Enviroment } from '../maker/typings';

describe('maker/makeIcons.ts', () => {
  const env: Enviroment = {
    paths: {
      DIST_BOILERPLATE: path.resolve(__dirname, '../maker/boilerplate/dist.ts.tpl'),
      MANIFEST_BOILERPLATE: path.resolve(__dirname, '../maker/boilerplate/manifest.ts.tpl'),
      ICON_BOILERPLATE: path.resolve(__dirname, '../maker/boilerplate/icon.ts.tpl'),
      INDEX_BOILERPLATE: path.resolve(__dirname, '../maker/boilerplate/index.ts.tpl'),
      RENDER_BOILERPLATE: path.resolve(__dirname, '../maker/boilerplate/render.ts'),
      TYPES_BOILERPLATE: path.resolve(__dirname, '../maker/boilerplate/types.ts'),
      DIST_OUTPUT: path.resolve(__dirname, './mock/src/dist.ts'),
      ICON_OUTPUT_DIR: path.resolve(__dirname, './mock/src'),
      INDEX_OUTPUT: path.resolve(__dirname, './mock/src/index.ts'),
      MANIFEST_OUTPUT: path.resolve(__dirname, './mock/src/manifest.ts'),
      RENDER_OUTPUT: path.resolve(__dirname, './mock/src/render.ts'),
      TYPES_OUTPUT: path.resolve(__dirname, './mock/src/types.ts'),
      SVG_DIR: path.resolve(__dirname, './mock/svg'),
      INLINE_SVG_OUTPUT_DIR: path.resolve(__dirname, './mock/inline-svg'),
      INLINE_SVG_THEME_LINEAR_OUTPUT: path.resolve(__dirname, './mock/inline-svg/linear/*.svg'),
      INLINE_SVG_THEME_PLANE_OUTPUT: path.resolve(__dirname, './mock/inline-svg/plane/*.svg'),
      INLINE_SVG_THEME_BIS_OUTPUT: path.resolve(__dirname, './mock/inline-svg/bis/*.svg'),
      THEME_LINEAR_OUTPUT: path.resolve(__dirname, './mock/src/linear/*.ts'),
      THEME_PLANE_OUTPUT: path.resolve(__dirname, './mock/src/plane/*.ts'),
      THEME_BIS_OUTPUT: path.resolve(__dirname, './mock/src/bis/*.ts')
    },
    base: path.resolve(__dirname, './'),
    options: {
      svgo: enviroment.options.svgo,
      prettier: enviroment.options.prettier
    }
  };

  const refreshPath = 'M17.17 5a8.19 8.19 0 0 1 3 6.58 7.87 7.87 0 0 1-7.81 7.91 5.12 5.12 0 0 1-.69 0 5.72 5.72 0 0 0 5-5.7 5.87 5.87 0 0 0-3-5.28l-2 2.06.12-7.15 6.82.12z';

  it('should OKAY.', async () => {
    await make(env);
    const linearString = await fs.readFile(
      `${env.paths.ICON_OUTPUT_DIR}/linear/RefreshLinear.ts`,
      'utf8'
    );
    expect(linearString).toContain(refreshPath);
  });
})
