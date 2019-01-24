import { Component, OnInit } from '@angular/core';
import { Manifest, ThemeType, IconService, manifest } from '@whale/aicon';

@Component({
  selector: 'lx-root',
  template: `
    <!--The content below is only a placeholder and can be replaced.-->
    <h1> LxTech自研图标库 [@whale/dot-aicon]</h1>
    <p>
      三种可选主题配置&emsp;
      <select (change)="changeIcons()" [(ngModel)]="currentTheme">
        <option value="linear">linear(线框)</option>
        <option value="plane">plane(填充)</option>
        <option value="bis">bis(双色)</option>
      </select>
    </p>

    <ng-container *ngFor="let name of icons;">
      <i lxIcon [type]="name" [theme]="currentTheme"></i>
    </ng-container>
  `,
  styles: [`
    h1 {
      font-family: Arial,Verdana,Sans-serif
    }
    i {
      font-size: 4rem;
      color: green;
      margin: 0 1rem;
    }
  `]
})
export class AppComponent implements OnInit {
  currentTheme: ThemeType = 'linear';
  names: Manifest = manifest;
  icons: string[] = [];

  changeIcons(): void {
    this.icons = this.names[ this.currentTheme ];
  }

  constructor(private _iconService: IconService) {
    this._iconService.bisColor = { primaryColor: 'green'} ;
  }

  ngOnInit(): void {
    this.changeIcons();
  }

}
