/*
 * @CreateTime: Jan 17, 2019 3:19 PM
 * @Author: psw0msd
 * @Contact: psw0msd@gmail.com
 * @Last Modified By: psw0msd
 * @Last Modified Time: Jan 23, 2019 4:50 PM
 * @Description: icon图标可配参数接口定义
 */

export interface IconDefinition {
  name: string;
  theme?: ThemeType;
  icon: string;
}

// svg同一图标不同输出目录名，纯线框linear、单色平面plane、双色平面bis
export type ThemeType = 'linear' | 'plane' | 'bis';

export interface Manifest {
  linear: string[];
  plane: string[];
  bis: string[];
}


export interface CachedIconDefinition {
  name: string;
  theme: string;
  icon: SVGElement;
}

export interface BisColorPaletteSetter {
  primaryColor: string;
  secondaryColor?: string;
}

export interface BisColorPalette extends BisColorPaletteSetter {
  secondaryColor: string;
}