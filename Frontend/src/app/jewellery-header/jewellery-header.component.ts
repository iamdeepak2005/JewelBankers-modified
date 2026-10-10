import { Component } from '@angular/core';
import {  MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  selector: 'app-jewellery-header',
  standalone: true,
  imports: [MatIconModule,CommonModule],
  templateUrl: './jewellery-header.component.html',
  styleUrl: './jewellery-header.component.css',
  animations: [
    trigger('slideToggle', [
      state(
        'void',
        style({
          height: '0px',
          opacity: 0,
          overflow: 'hidden',
        })
      ),
      state(
        '*',
        style({
          height: '*',
          opacity: 1,
        })
      ),
      transition('void <=> *', [animate('300ms ease-in-out')]),
    ]),
  ],
})
export class JewelleryHeaderComponent {
  constructor(private router:Router){

  }  
  isOpen: Record<string, boolean> = {
    dashboard: false,
  };

  toggleSection(section: string) {
    this.isOpen[section] = !this.isOpen[section];
  }
  openSection(section: string): void {
    this.isOpen[section] = true;
  }
  
  closeSection(section: string): void {
    this.isOpen[section] = false;
  }
  stockAddition(){
    this.router.navigate(['/stockAddition'])
  }
  pawnSite(){
    this.router.navigate(['/login'])
  }
  logout(){
    this.router.navigate(['/logout'])
  }

}
