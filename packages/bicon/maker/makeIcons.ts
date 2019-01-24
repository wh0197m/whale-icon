/*
 * @CreateTime: Jan 17, 2019 2:25 PM
 * @Author: psw0msd
 * @Contact: psw0msd@gmail.com
 * @Last Modified By: psw0msd
 * @Last Modified Time: Jan 18, 2019 3:02 PM
 * @Description: make工具将svg源文件中的关键属性提取出来，以流的方式自动生成TS模块文件
 */
'use strict';
import fs = require('fs-extra');
import path = require('path');
import _ = require('lodash');
import parse5 = require('parse5'); // HTML文本解析和序列化工具
import { from, Observable, of, Subscription } from 'rxjs';
import { concat, filter, map, mergeMap, reduce } from 'rxjs/operators';
import SVGO = require('svgo');
import Prettier = require('prettier');

import { renderIconDefinitionToSVGElement } from './boilerplate/render';
import {
  EXPORT_DEFAULT_COMPONENT_FROM_DIR,
  EXPORT_DEFAULT_MANIFEST,
  EXPORT_DEFAULT_DIST,
  ICON_IDENTIFIER,
  ICON_JSON,
  NORMAL_VIEWBOX,
  REGULAR_VIEWBOX,
  THEME_LINEAR,
  THEME_PLANE,
  THEME_BIS
} from './config';
import {
  HTMLNode,
  Enviroment,
  NameAndPath,
  GenerateIconMetaData,
  WriteFileMetaData,
  ThemeType,
  Manifest,
  IconDefinition
} from './typings';
import {
  reset,
  getIdentifier,
  getFormattedFileNameList,
  isAccessable,
  generateAbstractTree,
  replaceFillColor,
  logger
} from './utils';

export async function make(env: Enviroment) {
  const svgo = new SVGO(env.options.svgo);
  const singleType: ThemeType[] = ['linear', 'plane']; // 单色icon
  const svgoForSingleIcon = new SVGO({
    ...env.options.svgo,
    plugins: [
      ...env.options.svgo.plugins!, // 这里对plugin进行非空断言
      { removeAttrs: { attrs: ['fill']}} // linear和plane类型不需要填充色
    ]
  });

  await reset(env);

  // 获取svg目录下的文件名列表
  const svgBasicNames = await getFormattedFileNameList(env);

  const svgMetaDataWithTheme$ = from<ThemeType>([
    'linear',
    'plane',
    'bis'
  ]).pipe(
    map<ThemeType, Observable<GenerateIconMetaData>>((theme) =>
      from(svgBasicNames).pipe(
        map<string, NameAndPath>((kebabCaseName) => {
          const identifier = getIdentifier(_.upperFirst(_.camelCase(kebabCaseName)), theme);
          return { kebabCaseName, identifier };
        }),
        filter( ({kebabCaseName}) => isAccessable(path.resolve(env.paths.SVG_DIR, theme, `${kebabCaseName}.svg`))),
        mergeMap<NameAndPath, GenerateIconMetaData>(
          async ({ kebabCaseName, identifier }) => {
            const tryUrl = path.resolve(env.paths.SVG_DIR, theme, `${kebabCaseName}.svg`);
            let optimizer = svgo;
            if (singleType.includes(theme)) { optimizer = svgoForSingleIcon };
            const { data } = await optimizer.optimize(await fs.readFile(tryUrl, 'utf8'));
            const icon: IconDefinition = {
              name: kebabCaseName,
              theme,
              icon: {
                ...generateAbstractTree(
                  (parse5.parseFragment(data) as any).childNodes[0] as HTMLNode,
                  kebabCaseName
                )
              }
            };
            return { identifier, icon };
          }
        )
      )
    )
  );

  const GenerateIconMetaData$ = svgMetaDataWithTheme$.pipe(
    mergeMap<Observable<GenerateIconMetaData>, GenerateIconMetaData>((metaData$) => metaData$),
    map<GenerateIconMetaData, GenerateIconMetaData>(
      ({ identifier, icon }) => {
        icon = _.cloneDeep(icon);
        if (typeof icon.icon !== 'function') {
          if (icon.icon.attrs.class) {
            icon.icon.attrs = _.omit(icon.icon.attrs, ['class']);
          }
        }
        if (icon.theme === 'bis') {
          if (typeof icon.icon !== 'function' && icon.icon.children) {
            icon.icon.children.forEach((pathElement) => {
              pathElement.attrs.fill = pathElement.attrs.fill || '#333';
            });
          }
        }
        return { identifier, icon };
      }
    )
  );

  const inlineSVGFiles$ = GenerateIconMetaData$.pipe(
    map<GenerateIconMetaData, WriteFileMetaData>(({ icon }) => {
      return {
        path: path.resolve(
          env.paths.INLINE_SVG_OUTPUT_DIR,
          icon.theme,
          `./${icon.name}.svg`
        ),
        content: renderIconDefinitionToSVGElement(icon)
      };
    })
  );

  // 生成具体某个icon的ts类
  const iconTsBio = await fs.readFile(env.paths.ICON_BOILERPLATE, 'utf8');
  const iconFiles$ = GenerateIconMetaData$.pipe(
    map<GenerateIconMetaData, {identifier: string; content: string; theme: ThemeType}>(({ identifier, icon}) => {
      return {
        identifier,
        theme: icon.theme,
        content:
          icon.theme === 'bis' ?
          Prettier.format(
            iconTsBio
              .replace(ICON_IDENTIFIER, identifier)
              .replace(
                ICON_JSON,
                JSON.stringify({ ...icon, icon: 'FUNCTION' }).replace(
                  `"FUNCTION"`,
                  `function (primaryColor: string, secondaryColor: string) {` +
                    `return ${replaceFillColor(
                      JSON.stringify(icon.icon)
                    )};` +
                      ` }`
                )
              ),
            { ...env.options.prettier, parser: 'typescript' }
          )
          : Prettier.format(
            iconTsBio
              .replace(ICON_IDENTIFIER, identifier)
              .replace(ICON_JSON, JSON.stringify(icon)),
            env.options.prettier
          )
      };
    }),
    map<{identifier: string; content: string; theme: ThemeType}, WriteFileMetaData>(({ identifier, content, theme }) => ({
        path: path.resolve(
          env.paths.ICON_OUTPUT_DIR,
          theme,
          `./${identifier}.ts`
        ),
        content
      }))
  );

  // 生成index文件
  const indexTsBio = await fs.readFile(env.paths.INDEX_BOILERPLATE, 'utf8');
  const indexFile$ = svgMetaDataWithTheme$.pipe(
    mergeMap<Observable<GenerateIconMetaData>, GenerateIconMetaData>((metaData$) => metaData$),
    reduce<GenerateIconMetaData, string>(
      (attr, { identifier, icon}) =>
        attr +
        `export { default as ${identifier} } from './${icon.theme}/${identifier}';\n`,
        ''
    ),
    map<string, WriteFileMetaData>((content) => ({
      path: env.paths.INDEX_OUTPUT,
      content: Prettier.format(
        indexTsBio.replace(EXPORT_DEFAULT_COMPONENT_FROM_DIR, content),
        env.options.prettier
      )
    }))
  );

  // 生成manifest文件
  const manifestTsBio = await fs.readFile(env.paths.MANIFEST_BOILERPLATE, 'utf8');
  const manifestFile$ = from<ThemeType>(['linear', 'plane', 'bis']).pipe(
    map<ThemeType, { theme: ThemeType; names: string[] }>((theme) => ({
      theme,
      names: svgBasicNames.filter((name) => isAccessable(path.resolve(env.paths.SVG_DIR, theme, `${name}.svg`)))
    })),
    reduce<{ theme: ThemeType; names: string[] }, Manifest>(
      (attr, { theme, names }) => {
        attr[theme] = names;
        return attr;
      },
      { linear: [], plane: [], bis: [] }
    ),
    map<Manifest, WriteFileMetaData>((names) => ({
      path: env.paths.MANIFEST_OUTPUT,
      content: Prettier.format(
        manifestTsBio.replace(
          EXPORT_DEFAULT_MANIFEST,
          `export default ${JSON.stringify(names)};`
        ),
        env.options.prettier
      )
    }))
  );

  // 生成dist文件
  const distTsBio = await fs.readFile(env.paths.DIST_BOILERPLATE, 'utf8');
  const dist$ = GenerateIconMetaData$.pipe(
    map<GenerateIconMetaData, string>(({ identifier, icon }) => {
      let content = '';
      if (icon.theme === 'bis') {
        if (typeof icon.icon !== 'function') {
          const paths = (icon.icon.children || [])
            .filter(({ attrs }) => typeof attrs.d === 'string')
            .map(({ attrs }) => {
              const { fill, d } = attrs;
              if (fill && d) {
                return `['${fill}', '${d}']`;
              }
              return `'${d}'`;
            })
            .join(',');
          content = Prettier.format(
            `export const ${identifier}: IconDefinition = ` +
            `getIcon('${icon.name}', '${icon.theme}', ${replaceFillColor(
              `function (primaryColor: string, secondaryColor: string) {` +
                ` return getNode('${icon.icon.attrs.viewBox}', ${paths}) }`
            )})`,
            { ...env.options.prettier, parser: 'typescript' }
          );
        }
      } else {
        if (typeof icon.icon !== 'function') {
          const paths = (icon.icon.children || [])
            .filter(({ attrs }) => typeof attrs.d === 'string')
            .map(({ attrs }) => {
              const { fill, d } = attrs;
              if (fill && d) {
                return `['${fill}', '${d}']`;
              }
              return `'${d}'`;
            })
            .join(',');
          content = Prettier.format(
            `export const ${identifier}: IconDefinition = ` +
            `getIcon('${icon.name}', '${icon.theme}', ` +
            `getNode('${icon.icon.attrs.viewBox}', ${paths})` +
            `);`,
            env.options.prettier
          );
        }
      }
      content = content
        .replace(NORMAL_VIEWBOX, 'normalViewBox')
        .replace(REGULAR_VIEWBOX, 'regularViewBox')
        .replace(THEME_LINEAR, 'linear')
        .replace(THEME_PLANE, 'plane')
        .replace(THEME_BIS, 'bis');
      return content;
    }),
    reduce<string, string>((attr, nextContent) => attr + nextContent, ''),
    map<string, WriteFileMetaData>((content) => ({
      path: env.paths.DIST_OUTPUT,
      content: distTsBio.replace(EXPORT_DEFAULT_DIST, content)
    }))
  );

  // 生成types文件
  const typesTsBio = await fs.readFile(env.paths.TYPES_BOILERPLATE, 'utf8');
  const types$ = of<WriteFileMetaData>({
    path: env.paths.TYPES_OUTPUT,
    content: typesTsBio
  });

  // 生成render文件
  const rendersTsBio = await fs.readFile(env.paths.RENDER_BOILERPLATE, 'utf8');
  const renders$ = of<WriteFileMetaData>({
    path: env.paths.RENDER_OUTPUT,
    content: rendersTsBio
  });

  const files$ = iconFiles$.pipe(
    concat(inlineSVGFiles$),
    concat(manifestFile$),
    concat(indexFile$),
    concat(dist$),
    concat(types$),
    concat(renders$)
  );

  return new Promise<Subscription>((resolve, reject) => {
    const subscription = files$
      .pipe(
        mergeMap(async ({ path: writeFilePath, content }) => {
          await fs.writeFile(writeFilePath, content, 'utf8');
          logger.info(`Generated ./${path.relative(env.base, writeFilePath)}.`);
        })
      )
      .subscribe(undefined, reject, () => {
        logger.notice('Everthing is OKAY. [by lxtech]');
        resolve(subscription);
      });
  });
}
