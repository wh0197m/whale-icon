/*
 * @CreateTime: Jan 17, 2019 2:25 PM
 * @Author: psw0msd
 * @Contact: psw0msd@gmail.com
 * @Last Modified By: psw0msd
 * @Last Modified Time: Jan 23, 2019 5:04 PM
 * @Description: make工具将svg源文件中的关键属性提取出来，以流的方式自动生成TS模块文件
 */
'use strict';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import * as SVGO from 'svgo';
import * as Prettier from 'prettier';
import { from, Observable, of, Subscription } from 'rxjs';
import { concat, filter, map, mergeMap, reduce } from 'rxjs/operators';

import {
  EXPORT_DEFAULT_COMPONENT_FROM_DIR,
  EXPORT_DEFAULT_MANIFEST,
  ICON_IDENTIFIER,
  ICON_JSON,
} from './config';
import {
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
  isAccessable,
  logger,
  getFormattedFileNameList
} from './utils';

export async function make(env: Enviroment) {
  const svgo = new SVGO(env.options.svgo);
  const singleType: ThemeType[] = ['plane', 'linear']; // 单色icon
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
    'plane',
    'linear',
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
            const optimizer = singleType.includes(theme) ? svgoForSingleIcon : svgo;
            const { data } = await optimizer.optimize(await fs.readFile(tryUrl, 'utf8'));
            const icon: IconDefinition = {
              name: kebabCaseName,
              theme,
              icon: data
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
          if (icon.icon.includes('class')) {
            icon.icon = icon.icon.replace(/class="(\w|\S).*?"/, '');
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
          icon.theme as ThemeType,
          `./${icon.name}.svg`
        ),
        content: icon.icon
      };
    })
  );

  // 生成具体某个icon的ts类
  const iconTsBio = await fs.readFile(env.paths.ICON_BOILERPLATE, 'utf8');
  const iconFiles$ = GenerateIconMetaData$.pipe(
    map<GenerateIconMetaData, {identifier: string; content: string; theme: ThemeType}>(({ identifier, icon }) => {
      return {
        identifier,
        theme: icon.theme as ThemeType,
        content: Prettier.format(
            iconTsBio
              .replace(ICON_IDENTIFIER, identifier)
              .replace(ICON_JSON, JSON.stringify(icon)),
            { ...env.options.prettier, parser: 'typescript' }
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
        `export { ${identifier} } from './${icon.theme}/${identifier}';\n`,
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
          `export const manifest: Manifest = ${JSON.stringify(names)};`
        ),
        env.options.prettier
      )
    }))
  );

  // 生成types文件
  const typesTsBio = await fs.readFile(env.paths.TYPES_BOILERPLATE, 'utf8');
  const types$ = of<WriteFileMetaData>({
    path: env.paths.TYPES_OUTPUT,
    content: typesTsBio
  });

  const files$ = iconFiles$.pipe(
    concat(inlineSVGFiles$),
    concat(manifestFile$),
    concat(indexFile$),
    concat(types$)
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
