import tinycolor2 from 'tinycolor2';
import { IconDefinition, ThemeType } from './types'; // types依赖于npm run make生成

// ---------色板生成算法，可参考ant-design-palettes---------
const hueStep = 2; // 色相阶梯
const saturationStep = 16; // 饱和度阶梯，浅色部分
const saturationStep2 = 5; // 饱和度阶梯，深色部分
const brightnessStep1 = 5; // 亮度阶梯，浅色部分
const brightnessStep2 = 15; // 亮度阶梯，深色部分
const lightColorCount = 5; // 浅色数量，主色上
const darkColorCount = 4; // 深色数量，主色下

const presetPrimaryColors: {
    [key: string]: string;
} = {
    red: '#F5222D',
    volcano: '#FA541C',
    orange: '#FA8C16',
    gold: '#FAAD14',
    yellow: '#FADB14',
    lime: '#A0D911',
    green: '#52C41A',
    cyan: '#13C2C2',
    blue: '#1890FF',
    geekblue: '#2F54EB',
    purple: '#722ED1',
    magenta: '#EB2F96',
    grey: '#666666',
};

interface HsvObject {
  h: number;
  s: number;
  v: number;
}

function getHue(hsv: HsvObject, i: number, light?: boolean) {
  let hue;
  // 根据色相不同，色相转向不同
  if (Math.round(hsv.h) >= 60 && Math.round(hsv.h) <= 240) {
    hue = light ? Math.round(hsv.h) - (hueStep * i) : Math.round(hsv.h) + (hueStep * i);
  } else {
    hue = light ? Math.round(hsv.h) + (hueStep * i) : Math.round(hsv.h) - (hueStep * i);
  }
  if (hue < 0) {
    hue += 360;
  } else if (hue >= 360) {
    hue -= 360;
  }
  return hue;
}

function getSaturation(hsv: HsvObject, i: number, light?: boolean) {
  // grey color don't change saturation
  if (hsv.h === 0 && hsv.s === 0) {
    return hsv.s;
  }
  let saturation;
  if (light) {
    saturation = Math.round(hsv.s * 100) - (saturationStep * i);
  } else if (i === darkColorCount) {
    saturation = Math.round(hsv.s * 100) + (saturationStep);
  } else {
    saturation = Math.round(hsv.s * 100) + (saturationStep2 * i);
  }
  // 边界值修正
  if (saturation > 100) {
    saturation = 100;
  }
  // 第一格的 s 限制在 6-10 之间
  if (light && i === lightColorCount && saturation > 10) {
    saturation = 10;
  }
  if (saturation < 6) {
    saturation = 6;
  }
  return saturation;
}

function getValue(hsv: HsvObject, i: number, light?: boolean) {
  if (light) {
    return Math.round(hsv.v * 100) + (brightnessStep1 * i);
  }
  return Math.round(hsv.v * 100) - (brightnessStep2 * i);
}

export function generate(color: string) {
    const patterns: string[] = [];
    const pColor = tinycolor2(color);
    for (let i = lightColorCount; i > 0; i -= 1) {
        const hsv = pColor.toHsv();
        const colorString = tinycolor2({
        h: getHue(hsv, i, true),
        s: getSaturation(hsv, i, true),
        v: getValue(hsv, i, true),
        }).toHexString();
        patterns.push(colorString);
    }
    patterns.push(pColor.toHexString());
    for (let i = 1; i <= darkColorCount; i += 1) {
        const hsv = pColor.toHsv();
        const colorString = tinycolor2({
        h: getHue(hsv, i),
        s: getSaturation(hsv, i),
        v: getValue(hsv, i),
        }).toHexString();
        patterns.push(colorString);
    }
    return patterns;
};

export interface PalettesProps {
    [key: string]: string[];
};

const presetPalettes: PalettesProps = {};

Object.keys(presetPrimaryColors).forEach(key => {
    presetPalettes[key] = generate(presetPrimaryColors[key]);
});

// 转换信息输出
export const lxOuputPrefix = '[@lxtech/aicon]: ';

export function outputErr(message: string): void {
  console.error(`${lxOuputPrefix}${message}.`);
}

export function outputWarn(message: string): void {
  console.warn(`${lxOuputPrefix}${message}.`);
}

export function getSecondaryColor(primaryColor: string): string {
  return generate(primaryColor)[0];
}

export function withSuffix(name: string, theme: ThemeType | undefined): string {
  switch (theme) {
    case 'plane': return `${name}-plane`;
    case 'linear': return `${name}-linear`;
    case 'bis': return `${name}-bis`;
    case undefined: return name;
    default: throw new Error(`${lxOuputPrefix}Theme "${theme}" is not a recognized theme!`);
  }
}

export function withSuffixAndColor(name: string, theme: ThemeType, pri: string, sec: string): string {
  return `${withSuffix(name, theme)}-${pri}-${sec}`;
}

export function alreadyHasAThemeSuffix(name: string): boolean {
  return name.endsWith('-plane') || name.endsWith('-linear') || name.endsWith('-bis');
}

export function isIconDefinition(target: string | IconDefinition): target is IconDefinition {
  return (
    typeof target === 'object' &&
    typeof target.name === 'string' &&
    (typeof target.theme === 'string' || target.theme === undefined) &&
    typeof target.icon === 'string'
  );
}

/**
 * Get an `IconDefinition` object from abbreviation type, like `account-book-fill`.
 * @param str
 */
export function getIconDefinitionFromAbbr(str: string): IconDefinition {
  const arr = str.split('-');
  const theme = arr.splice(arr.length - 1, 1)[0];
  const name = arr.join('-');

  return {
    name,
    theme,
    icon: ''
  } as IconDefinition;
}

export function cloneSVG(svg: SVGElement): SVGElement {
  return svg.cloneNode(true) as SVGElement;
}

/**
 * Parse inline SVG string and replace colors with placeholders. For twotone icons only.
 */
export function replaceFillColor(raw: string): string {
  return raw
    .replace(/['"]#333['"]/g, '"primaryColor"')
    .replace(/['"]#E6E6E6['"]/g, '"secondaryColor"')
    .replace(/['"]#D9D9D9['"]/g, '"secondaryColor"')
    .replace(/['"]#D8D8D8['"]/g, '"secondaryColor"');
}

/**
 * Split a name with namespace in it into a tuple like [ name, namespace ].
 */
export function getNameAndNamespace(type: string): [string, string] {
  const split = type.split(':');
  switch (split.length) {
    case 1: return [type, ''];
    case 2: return [split[1], split[0]];
    default: throw new Error(`${lxOuputPrefix}The icon type ${type} is not valid!`);
  }
}

export function hasNamespace(type: string): boolean {
  return getNameAndNamespace(type)[1] !== '';
}

