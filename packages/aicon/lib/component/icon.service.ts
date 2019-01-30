import { Inject, Injectable, Optional, Renderer2, RendererFactory2, SecurityContext } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { of as observableOf, Observable } from 'rxjs';
import { catchError, finalize, map, share, tap } from 'rxjs/operators';

import { HttpModuleNotImport, IconNotFoundError, NameSpaceIsNotSpecifyError, SVGTagNotFoundError, UrlNotSafeError } from "./icon.error";
import {
  cloneSVG,
  getIconDefinitionFromAbbr,
  getNameAndNamespace,
  getSecondaryColor,
  hasNamespace,
  isIconDefinition,
  replaceFillColor,
  withSuffix,
  withSuffixAndColor
} from '../utils';
import { ThemeType, IconDefinition, CachedIconDefinition, BisColorPalette, BisColorPaletteSetter } from '../types';

@Injectable({
  providedIn: 'root'
})
export class IconService {
  defaultTheme: ThemeType = 'linear';

  protected _renderer: Renderer2;
  protected _http: HttpClient;

  // 所有的icon定义都会在这里注册
  protected _svgDefinitions = new Map<string, IconDefinition>();

  // 缓存所有已经经过render函数处理过的icon
  protected _svgRenderedDefinitions = new Map<string, CachedIconDefinition>();
  protected _inProgressFetches = new Map<string, Observable<IconDefinition | null>>();

  // 定义一个assets的默认路径，后面允许赋值
  protected _assetsUrlRoot = '';

  protected _bisColorPalette: BisColorPalette = {
    primaryColor: '#333333',
    secondaryColor: '#E6E6E6'
  }

  set bisColor({ primaryColor, secondaryColor }: BisColorPaletteSetter) {
    this._bisColorPalette.primaryColor = primaryColor;
    this._bisColorPalette.secondaryColor = secondaryColor || getSecondaryColor(primaryColor);
  }

  get bisColor(): BisColorPaletteSetter {
    return { ...this._bisColorPalette } as BisColorPalette;
  }

  constructor(
    protected _rendererFactory: RendererFactory2, // 仅用来构造和初始化一个自定义的render2
    @Optional() protected _handler: HttpBackend, // 最后一个HttpHandler，它直接将请求通过HTTP API发给后端
    @Optional() @Inject(DOCUMENT) protected _document: any,
    protected sanitizer: DomSanitizer // 用来净化内容，防范xss
  ) { 
    this._renderer = this._rendererFactory.createRenderer(null, null);
    if (this._handler) {
      this._http = new HttpClient(this._handler); // 如果使用icon.service时，我们可以指定拦截器
    }
  }

  changeAssetsSource(prefix: string): void {
    this._assetsUrlRoot = prefix.endsWith('/') ? prefix : prefix + '/';
  }

  addIcon(...icons: IconDefinition[]): void {
    icons.forEach(icon => {
      this._svgDefinitions.set(withSuffix(icon.name, icon.theme), icon);
    });
  }

  /**
   *
   * * 根据类型注册icon
   * @param {string} type
   * @param {string} literal
   * @memberof IconService
   */
  addIconLiteral(type: string, literal: string): void {
    const [ name, namespace ] = getNameAndNamespace(type);
    if (!namespace) {
      throw NameSpaceIsNotSpecifyError();
    }
    this.addIcon({ name: type, icon: literal });
  }

  // 清空所有缓存内容
  clear(): void {
    this._svgDefinitions.clear();
    this._svgRenderedDefinitions.clear();
  }

  /**
   *
   * * 根据icon的定义，生成一个SVGElment
   * @param {(IconDefinition | string)} icon
   * @param {string} [bisColor]
   * @returns {Observable<SVGElement>}
   * @memberof IconService
   */
  getRenderedContent(icon: IconDefinition | string, bisColor?: string):Observable<SVGElement> {
    // 如果icon是IconDefinition类，直接进入下一步操作，否则获取缓存中的icon，并将其封装成一个Observable对象
    const definition: IconDefinition | null | undefined = isIconDefinition(icon) ? icon as IconDefinition : this._svgDefinitions.get(icon as string);
    const $iconDefinition = definition ? observableOf(definition) : this._getFromRemote(icon as string);
    // 如果icon是一个IconDefinition类，直接渲染成SVGElment返回，否则报错
    return $iconDefinition.pipe(map(i => {
      if (!i) { throw IconNotFoundError(icon as string); }
      return this._loadSVGFromCacheOrCreateNew(i, bisColor);
    }));
  }

  /**
   *
   * * 根据路径获取原始的svg，然后组装成一个IconDefinition类
   * @protected
   * @param {string} type
   * @returns {(Observable<IconDefinition | null>)}
   * @memberof IconService
   */
  protected _getFromRemote(type: string): Observable<IconDefinition | null> {
    if (!this._http) { return observableOf(HttpModuleNotImport()); }
    // 如果多个指令在同一个时刻访问同一个icon，仅触发最后一个
    let inProgress =  this._inProgressFetches.get(type);

    if (!inProgress) {
      const [name, namespace] = getNameAndNamespace(type);
      const icon: IconDefinition = namespace ? { name, icon: ''} : getIconDefinitionFromAbbr(name);
      const url = namespace ? `${this._assetsUrlRoot}assets/${namespace}/${icon.name}.svg` : `${this._assetsUrlRoot}assets/${icon.theme}/${icon.name}.svg`;
      const safeUrl = this.sanitizer.sanitize(SecurityContext.URL, url);
      if (!safeUrl) { throw UrlNotSafeError(url); }

      inProgress = this._http.get(safeUrl, { responseType: 'text' }).pipe(
        map(literal => ({ ...icon, icon: literal })),
        tap(definition => this.addIcon(definition)),
        finalize(() => this._inProgressFetches.delete(type)),
        catchError(() => observableOf(null)),
        share()
      );
      this._inProgressFetches.set(type, inProgress);
    }

    return inProgress;
  }
  /**
   *
   * * 根据给定的IconDefinition渲染生成一个新的SVGElement, 或者从缓存中拷贝一个副本
   * @protected
   * @param {IconDefinition} icon
   * @param {string} [bisColor]
   * @returns {SVGElement}
   * @memberof IconService
   */
  protected _loadSVGFromCacheOrCreateNew(icon: IconDefinition, bisColor?: string): SVGElement {
    let svg: SVGElement;

    const pri = bisColor || this._bisColorPalette.primaryColor;
    const sec = getSecondaryColor(pri) || this._bisColorPalette.secondaryColor;
    const key = icon.theme === 'bis' ? withSuffixAndColor(icon.name, icon.theme, pri, sec) : icon.theme === undefined ? icon.name : withSuffix(icon.name, icon.theme);

    const cached = this._svgRenderedDefinitions.get(key);

    if (cached) {
      svg = cached.icon;
    } else {
      svg = this._setSVGAttribute(this._colorizeSVGIcon(
        this._createSVGElementFromString(hasNamespace(icon.name) ? icon.icon : replaceFillColor(icon.icon)),
        icon.theme === 'bis',
        pri,
        sec
      ));

      this._svgRenderedDefinitions.set(key, { ...icon, icon: svg} as CachedIconDefinition );
    }
    return cloneSVG(svg);
  }

  protected _createSVGElementFromString(str: string): SVGElement {
    const div = this._document.createElement('div');
    div.innerHTML = str;
    const svg: SVGElement = div.querySelector('svg');
    if (!svg) { throw SVGTagNotFoundError; }
    return svg;
  }

  protected _setSVGAttribute(svg: SVGElement): SVGElement {
    this._renderer.setAttribute(svg, 'width', '1em');
    this._renderer.setAttribute(svg, 'height', '1em');
    return svg;
  }

  protected _colorizeSVGIcon(svg: SVGElement, bis: boolean, pri: string, sec: string): SVGElement {
    if (bis) {
      const children = svg.childNodes;
      const length = children.length;
      for (let i = 0; i < length; i++) {
        const child: HTMLElement = children[ i ] as HTMLElement;
        if (child.getAttribute('fill') === 'secondaryColor') {
          this._renderer.setAttribute(child, 'fill', sec);
        } else {
           this._renderer.setAttribute(child, 'fill', pri);
        }
      }
    }
    this._renderer.setAttribute(svg, 'fill', 'currentColor');
    return svg;
  }
}
