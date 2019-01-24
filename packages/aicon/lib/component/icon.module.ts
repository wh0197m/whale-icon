import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective } from './icon.directive';
import { IconService } from './icon.service';

@NgModule({
  declarations: [ IconDirective ],
  imports: [ CommonModule ],
  exports: [ IconDirective ],
  providers: [ IconService ]
})
export class IconModule { }
