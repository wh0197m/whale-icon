/*
 * @CreateTime: Jan 17, 2019 2:23 PM
 * @Author: psw0msd
 * @Contact: psw0msd@gmail.com
 * @Last Modified By: psw0msd
 * @Last Modified Time: Jan 18, 2019 11:33 AM
 * @Description: 路径及d.ts等环境变量配置
 */
import path = require('path');
import { Enviroment } from './typings';

export const enviroment: Enviroment = {
  paths: {
    DIST_BOILERPLATE: path.resolve(__dirname, './boilerplate/dist.ts.tpl'),
    MANIFEST_BOILERPLATE: path.resolve(__dirname, './boilerplate/manifest.ts.tpl'),
    ICON_BOILERPLATE: path.resolve(__dirname, './boilerplate/icon.ts.tpl'),
    INDEX_BOILERPLATE: path.resolve(__dirname, './boilerplate/index.ts.tpl'),
    RENDER_BOILERPLATE: path.resolve(__dirname, './boilerplate/render.ts'),
    TYPES_BOILERPLATE: path.resolve(__dirname, './boilerplate/types.ts'),
    DIST_OUTPUT: path.resolve(__dirname, '../src/dist.ts'),
    ICON_OUTPUT_DIR: path.resolve(__dirname, '../src'),
    INDEX_OUTPUT: path.resolve(__dirname, '../src/index.ts'),
    MANIFEST_OUTPUT: path.resolve(__dirname, '../src/manifest.ts'),
    RENDER_OUTPUT: path.resolve(__dirname, '../src/render.ts'),
    TYPES_OUTPUT: path.resolve(__dirname, '../src/types.ts'),
    SVG_DIR: path.resolve(__dirname, '../svg'),
    INLINE_SVG_OUTPUT_DIR: path.resolve(__dirname, '../inline-svg'),
    INLINE_SVG_THEME_LINEAR_OUTPUT: path.resolve(__dirname, '../inline-svg/linear/*.svg'),
    INLINE_SVG_THEME_PLANE_OUTPUT: path.resolve(__dirname, '../inline-svg/plane/*.svg'),
    INLINE_SVG_THEME_BIS_OUTPUT: path.resolve(__dirname, '../inline-svg/bis/*.svg'),
    THEME_LINEAR_OUTPUT: path.resolve(__dirname, '../src/linear/*.ts'),
    THEME_PLANE_OUTPUT: path.resolve(__dirname, '../src/plane/*.ts'),
    THEME_BIS_OUTPUT: path.resolve(__dirname, '../src/bis/*.ts')
  },
  base: path.resolve(__dirname, '../'),
  options: {
    // svgo是一个可以优化svg的工具，可以作为一个node module使用
    // 参看：https://github.com/svg/svgo
    svgo: {
      floatPrecision: 2,
      plugins: [
        { cleanupAttrs: true },
        { removeDoctype: true },
        { removeXMLProcInst: true },
        { removeXMLNS: true },
        { removeComments: true },
        { removeMetadata: true },
        { removeTitle: true },
        { removeDesc: true },
        { removeUselessDefs: true },
        { removeEditorsNSData: true },
        { removeEmptyAttrs: true },
        { removeHiddenElems: true },
        { removeEmptyText: true },
        { removeEmptyContainers: true },
        { removeViewBox: false },
        { cleanupEnableBackground: true },
        { convertStyleToAttrs: true },
        { convertColors: true },
        { convertPathData: true },
        { convertTransform: true },
        { removeUnknownsAndDefaults: true },
        { removeNonInheritableGroupAttrs: true },
        { removeUselessStrokeAndFill: true },
        { removeUnusedNS: true },
        { cleanupIDs: true },
        { cleanupNumericValues: true },
        { moveElemsAttrsToGroup: true },
        { moveGroupAttrsToElems: true },
        { collapseGroups: true },
        { removeRasterImages: false },
        { mergePaths: true },
        { convertShapeToPath: true },
        { sortAttrs: true },
        { removeDimensions: true },
        { removeAttrs: { attrs: ['class'] } }
      ]
    },
    prettier: {
      parser: 'babylon',
      singleQuote: true
    }
  }
}
