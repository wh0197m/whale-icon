/*
 * @CreateTime: Jan 17, 2019 3:19 PM
 * @Author: psw0msd
 * @Contact: psw0msd@gmail.com
 * @Last Modified By: psw0msd
 * @Last Modified Time: Jan 17, 2019 4:46 PM
 * @Description: icon图标可配参数接口定义
 */

// svg同一图标不同输出目录名，纯线框linear、单色平面plane、双色平面bis
export type ThemeType = 'linear' | 'plane' | 'bis';

export interface AbstractNode {
  tag: string;
  attrs: {
    [key: string]: string;
  };
  children?: AbstractNode[];
}

export interface IconDefinition {
  name: string;
  theme: ThemeType;
  icon:
    | AbstractNode
    | ((primaryColor: string, secondaryColor: string) => AbstractNode);
}

export interface Manifest {
  linear: string[];
  plane: string[];
  bis: string[];
}

export interface RenderOptions {
  placeholders?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
  extraSVGAttrs?: {
    [key: string]: string;
  };
}
