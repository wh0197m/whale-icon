/*
 * @CreateTime: Jan 17, 2019 4:44 PM
 * @Author: psw0msd
 * @Contact: psw0msd@gmail.com
 * @Last Modified By: psw0msd
 * @Last Modified Time: Jan 17, 2019 4:45 PM
 * @Description: 根据HTML ELEMENTS配置参数，渲染生成svg标签
 */
import { AbstractNode, IconDefinition, RenderOptions } from './types';

// 转换html中的NODE为一个SVG元素
function _renderAbstractNodeToSVGElement(node: AbstractNode, options: RenderOptions): string {
    const targetAttrs = node.tag === 'svg' ? {...node.attrs, ...(options.extraSVGAttrs || {})} : node.attrs;
    // 遍历node上的所有属性及其值，将其属性汇总成一个数列
    const attrsList = Object.keys(targetAttrs).reduce((attr: string[], nextKey) => {
      const key = nextKey;
      const value = targetAttrs[key];
      const kv = `${key}='${value}'`;
      attr.push(kv);
      return attr;
    }, []);
    const attrs = attrsList.length ? ' ' + attrsList.join(' '): ''; // 注意用的是’ ‘中间的空格有无
    const container: [string, string] = [`<${node.tag}${attrs}>`,`</${node.tag}>`];
    const children = (node.children || [])
      .map((child) => _renderAbstractNodeToSVGElement(child, options))
      .join('');
    return `${container[0]}${children}${container[1]}`;
}

export function renderIconDefinitionToSVGElement(icon: IconDefinition, options: RenderOptions = {}): string {
  if (typeof icon.icon === 'function') {
    // 可配双色的icon
    const placeholders = options.placeholders || {};
    return _renderAbstractNodeToSVGElement(
      icon.icon(
        placeholders.primaryColor || '#333',
        placeholders.secondaryColor || '#E6E6E6'
      ),
      options
    );
  }
  // 线框linear和平面plane的icon无需初始化颜色
  return _renderAbstractNodeToSVGElement(icon.icon, options);
}
