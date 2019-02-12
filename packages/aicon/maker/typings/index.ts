import * as SVGO from 'svgo';
import * as Prettier from 'prettier';

import { IconDefinition } from './types';
export { IconDefinition, ThemeType, Manifest } from './types';

export interface HTMLNode {
  nodeName: string;
  tagName: string;
  attrs: Array<{ name: string; value: string }>;
  value?: string;
  childNodes: HTMLNode[];
}

export interface Enviroment {
  readonly paths: {
    SVG_DIR: string;
    DIST_BOILERPLATE: string;
    ICON_BOILERPLATE: string;
    INDEX_BOILERPLATE: string;
    MANIFEST_BOILERPLATE: string;
    TYPES_BOILERPLATE: string;
    ICON_OUTPUT_DIR: string;
    THEME_LINEAR_OUTPUT: string;
    THEME_PLANE_OUTPUT: string;
    THEME_BIS_OUTPUT: string;
    DIST_OUTPUT: string;
    MANIFEST_OUTPUT: string;
    INDEX_OUTPUT: string;
    TYPES_OUTPUT: string;
    INLINE_SVG_OUTPUT_DIR: string;
    INLINE_SVG_THEME_LINEAR_OUTPUT: string;
    INLINE_SVG_THEME_PLANE_OUTPUT: string;
    INLINE_SVG_THEME_BIS_OUTPUT: string;
  };
  readonly base: string;
  readonly options: {
    svgo: SVGO.Options;
    prettier: Prettier.Options;
  };
}

export interface NameAndPath {
  kebabCaseName: string;
  identifier: string;
}

export interface GenerateIconMetaData {
  identifier: string;
  icon: IconDefinition;
}

export interface WriteFileMetaData {
  path: string;
  content: string;
}
