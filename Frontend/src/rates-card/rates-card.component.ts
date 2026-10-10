import { CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-rates-card',
  standalone: true,
  imports: [MatCardModule,CommonModule,CdkDrag],
  templateUrl: './rates-card.component.html',
  styleUrl: './rates-card.component.css'
})
export class RatesCardComponent {
  gold: any
  silver:any;

  updatedDateTime: string = '';
  time: any;
  constructor() {
    this.setUpdatedTime();
  }
  setUpdatedTime() {
    const currentHour = new Date().getHours();
    let period = '';

    // Set period to 'Morning' or 'Evening' based on current hour
    if (currentHour >= 9 && currentHour < 17) {
      period = 'Morning'
      this.updatedDateTime = `${new Date().getDate()} ${period} 9'O Clock`;
      this.time=`${period} 9'O Clock`;
    } else {
      period = 'Evening';
      this.updatedDateTime = `${new Date().getDate()}/${new Date().getMonth()}/${new Date().getFullYear()}`;
      this.time=`${period} 5'O Clock`

    }

    // Format the updated date and time
  }
  rates :any

  ngOnInit(){
    this.gold = JSON.parse(localStorage.getItem('gold') || 'null'); // Parse JSON or default to null
    this.silver = JSON.parse(localStorage.getItem('silver') || 'null'); // Retrieves as a string
    const gold18k=this.gold.price_gram_18k
    const gold22k=this.gold.price_gram_24k
    const silver=this.silver.price_gram_24k+20
    this.rates=[
      { name: 'Gold Rate 18K', rate: 5889.7128, change: -50 },
      { name: 'Gold Rate 22K', rate: 7134.5346, change: 100 },
      { name: 'Silver Rate', rate: 99.9667, change: -5 }
    ];
  
  }

}
