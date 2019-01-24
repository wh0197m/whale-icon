/*
 * @CreateTime: Jan 18, 2019 2:35 PM
 * @Author: psw0msd
 * @Contact: psw0msd@gmail.com
 * @Last Modified By: psw0msd
 * @Last Modified Time: Jan 22, 2019 6:34 PM
 * @Description: 工具方法
 */

import * as fs from 'fs-extra';
import * as path from 'path';

import * as chalk from 'chalk';
import * as _ from 'lodash';
import * as rimraf from 'rimraf';
import * as globby from 'globby';
import { from } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

import { Enviroment, ThemeType } from './typings';

// 设计师给出的设计图标必须按类型放在svg如下三个自目录中
const folderNames: ThemeType[] = ['linear', 'plane', 'bis'];

// emoji符号来自：https://www.emojicopy.com/
export const logger = {
  info(message: string) {
    return console.log(chalk.default.green(`✅ [Okay] ${message}`));
  },
  notice(message: string) {
    return console.log(chalk.default.blue(`🎉 [Finished] ${message}`));
  }
}

/**
 *
 * * 根据不同的theme，各svg文件自动生成不同的文件名
 * @export
 * @param {string} identifier
 * @param {ThemeType} theme
 * @returns
 */
export function getIdentifier(identifier: string, theme: ThemeType) {
  switch (theme) {
    case 'linear':
      return `${identifier}Linear`;
    case 'plane':
      return `${identifier}Plane`;
    case 'bis':
      return `${identifier}Bis`;
    default:
      throw new TypeError(
        `Unknown theme type: ${theme}, identifier: ${identifier}`
      );
  }
}

export async function reset(env: Enviroment) {
  logger.notice(`Reset Folers.`);
  return Promise.all(
    (Object.keys(env.paths) as Array<keyof typeof env.paths>)
      .filter((key) => key.endsWith('OUTPUT')) // 清空输出路径中过去生成的代码文件
      .map((key) => {
        logger.notice(`Delete ${path.relative(env.base, env.paths[key])}.`);
        return new Promise((resolve) => rimraf(env.paths[key], resolve));
      })
  );
}

/**
 *
 * * 判断文件夹及文件的读写访问权限
 * @export
 * @param {string} url
 * @returns
 */
export function isAccessable(url: string) {
  let accessable = false;
  try {
    fs.accessSync(url);
    accessable = true;
  } catch (error) {
    accessable = false;
  }
  return accessable;
}

/**
 *
 * * 将设计师提供的文件名统一进行格式化输出
 * @export
 * @param {string} dir
 * @param {string} outDir
 * @returns
 */
export async function formatNamesFromDir(dir: string, outDir?: string) {
  const rawNames$ = from(await globby(['*.svg'], { cwd: dir, deep: false }));
  const beforeAndAfter$ = rawNames$.pipe(
    map((fileNameWithExtension: string) => {
      const formatted = fileNameWithExtension
        .replace(/\.svg$/, '')
        .replace(/-linear$/, '')
        .replace(/-plane$/, '')
        .replace(/-bis$/, '')
         + '.svg';
      return {
        before: fileNameWithExtension,
        after: formatted
      };
    })
  );
  return new Promise<void>((resolve, reject) => {
    beforeAndAfter$
      .pipe(
        mergeMap(async ({before, after}) => {
          fs.rename(path.join(dir, before), path.join(outDir || dir, after))
        })
      )
      .subscribe(undefined, reject, resolve);
  });
}

/**
 *
 * * 根据环境配置变量获取指定目录下的格式化文件名
 * @export
 * @param {Enviroment} env
 * @returns
 */
export async function getFormattedFileNameList(env: Enviroment) {
  for (const folderName of folderNames) {
    const dir = path.join(env.paths.SVG_DIR, folderName);
    await formatNamesFromDir(dir);
    logger.notice(`Formatted ${dir}`);
  }
  const listNames = _.uniq(
    _.flatten(
      await Promise.all(
        (['linear', 'plane', 'bis'] as ThemeType[]).map((theme) => {
          return globby(['*.svg'], {
            cwd: path.join(env.paths.SVG_DIR, theme),
            deep: false
          });
        })
      )
    )
  ).map((name) => name.replace(/\.svg$/, ''));
  return listNames;
}
