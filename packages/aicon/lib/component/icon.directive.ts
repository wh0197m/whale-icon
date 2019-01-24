import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';
import { alreadyHasAThemeSuffix, getNameAndNamespace, isIconDefinition, outputWarn, withSuffix } from '../utils';
import { IconService } from './icon.service';
import { IconDefinition, ThemeType } from '../types';

@Directive({
  selector: '[lxIcon]'
})
export class IconDirective implements OnChanges {
  @Input() type: string | IconDefinition;
  @Input() theme: ThemeType;
  @Input() bisColor: string;

  constructor(protected _iconService: IconService, protected _elementRef: ElementRef, protected _renderer: Renderer2) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.type || changes.theme || changes.bisColor) {
      this._changeIcon();
    }
  }

  protected _changeIcon(): Promise<SVGElement | null> {
    return new Promise<SVGElement | null>(resolve => {
      if (!this.type) {
        this._clearSVGElement();
        resolve(null);
      } else {
        this._iconService.getRenderedContent(
          this._parseIconType(this.type, this.theme),
          this.bisColor
        ).subscribe(svg => {
          this._setSVGElement(svg);
          resolve(svg);
        });
      }
    });
  }

  protected _parseIconType(type: string | IconDefinition, theme: ThemeType): IconDefinition | string {
    if (isIconDefinition(type)) {
      return type;
    } else {
      const [ name, namespace ] = getNameAndNamespace(type);
      if (namespace) {
        return type;
      }
      if (alreadyHasAThemeSuffix(name)) {
        if (!!theme) {
          outputWarn(`'type' ${name} already gets a theme inside so 'theme' ${theme} would be ignored`);
        }
        return name;
      } else {
        return withSuffix(name, theme || this._iconService.defaultTheme);
      }
    }
  }

  protected _setSVGElement(svg: SVGElement): void {
    this._clearSVGElement();
    this._renderer.appendChild(this._elementRef.nativeElement, svg);
  }

  protected _clearSVGElement(): void {
    const el: HTMLElement = this._elementRef.nativeElement;
    const children = el.childNodes;
    const length = children.length;
    for (let i = length - 1; i >= 0; i--) {
      const child = children[i] as HTMLElement;
      if (child.tagName.toLowerCase() === 'svg') {
        this._renderer.removeChild(el, child)
      }
    }
  }
}
