import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import {  HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import {  MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import { UserService } from '../user.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule,MatTooltipModule,RouterModule,MatIconModule,MatButtonModule, MatMenuModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
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
export class HeaderComponent implements OnInit {
isJewellery: boolean=false;
  shopName: string | undefined;
  shopAddress: string| undefined;
gold_rate: any;
silver_rate: any;

constructor(private authService:AuthService,private router: Router,private userService:UserService){
  this.currentDate = new Date().toLocaleString();
  this.remainingTime = this.calculateRemainingTime();

}
name: string | null | undefined;
email: string | null | undefined;
notificationType: string = 'payment'; // Default notification type
currentDate: string = new Date().toLocaleDateString();
remainingTime: string = '2 hours 30 minutes'; // Example remaining time
lastPaymentDate: string = '30/11/2024'; // Example payment date
trialEndDate: string = '14/12/2024'; // Example trial end date
reminderDate: string = '25/11/2024'; // Example reminder date

// Update notification dynamically based on some condition or action
updateNotification(type: string): void {
  this.notificationType = type;
}
isOpen: Record<string, boolean> = {
  dashboard: false,
};
getInitials(shopName: any): string {
  const words = shopName.split(' '); // Split the shop name into words
  const initials = words.slice(0, 2) // Take only the first two words
                        .map((word: string) => word.charAt(0).toUpperCase()) // Get the first letter of each word
                        .join(''); // Join the initials
  return initials;
}

toggleSection(section: string) {
  this.isOpen[section] = !this.isOpen[section];
}
openSection(section: string): void {
  this.isOpen[section] = true;
}

closeSection(section: string): void {
  this.isOpen[section] = false;
}
@HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Check if the 'Ctrl' key is pressed
    if (event.ctrlKey) {
      switch (event.key) {
        case 'o':
          event.preventDefault(); // Prevent the default print dialog
          this.router.navigate(['/pledge']); // Navigate to /pledge
          break;
        case 'f':
          event.preventDefault(); // Prevent any default actions (e.g., find on page)
          this.router.navigate(['/search']); // Navigate to /search
          break;
        case 'j':
            event.preventDefault(); // Prevent any default actions (e.g., find on page)
            this.router.navigate(['/jewellery']); // Navigate to /search
            break;
        case 'i':
          event.preventDefault(); // Prevent any default actions
          this.router.navigate(['/redeem']); // Navigate to /redeem
          break;
        case 'q':
          event.preventDefault(); // Prevent any default actions
          this.router.navigate(['/setting']); // Navigate to /setting
          break;
        case 'h':
            event.preventDefault(); // Prevent any default actions
            this.router.navigate(['/login']); // Navigate to /setting
            break;
        default:
          break; // Do nothing for other key combinations
      }
    }
  }
  // currentDate: string = new Date().toLocaleString();  // Get current date and time
  // remainingTime: string = '2 hours 30 minutes';



authenticated:boolean=false

ngOnInit() {
  if (localStorage.getItem('gold') || localStorage.getItem('silver')) {
    this.gold_rate = localStorage.getItem('gold');
    this.silver_rate = localStorage.getItem('silver');
  }
  if (sessionStorage.getItem('accessToken')) {
    this.authenticated = true;
  }
// Example with setTimeout for periodic checks
 // Check every 1 second

  this.userService.getSettings().subscribe(settings => {
    this.shopName = this.userService.getMySettingParamValueById('SHOP_NAME', settings);
    this.shopAddress = `${this.userService.getMySettingParamValueById('SHOP_NO', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_STREET', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_AREA', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_CITY', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_PINCODE', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_STATE', settings) || ''}`;
  });
  this.isJewellery=true
  // write logic for jewellery
  this.updateSessionData(); // Initial call
  setInterval(() => {
    this.updateSessionData();
  }, 1000); // Call every 2 seconds
  console.log("header"+this.isLoggedIn());

  this.isLoggedIn();
  setInterval(() => {
    this.currentDate = new Date().toLocaleString();
    this.remainingTime = this.calculateRemainingTime();
  }, 1000); // Updates every second

}
updateSessionData(): void {
  this.name = sessionStorage.getItem('username');
  this.email = sessionStorage.getItem('email');
  const userString = localStorage.getItem("user") || "{}";
  const user = JSON.parse(userString); // Now it's safe to parse

  if(!this.email && !this.name){
    this.name=user.username
    this.email=user.email
  }

}
calculateRemainingTime(): string {
  const remaining = 2 * 60 * 60 * 1000 + 30 * 60 * 1000; // Example 2 hours 30 minutes
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours} hours ${minutes} minutes`;
}

// Return the dynamic tooltip content as a string
getTooltipContent(): string {
  return `
    <strong>Log out</strong>
    <div><strong>Current Date:</strong> ${this.currentDate}</div>
    <div><strong>Remaining Time:</strong> ${this.remainingTime}</div>
  `;
}
roughPrint(){
  this.router.navigate(['/rough'])

}
user = { isLoggedIn: false };

logIn() {
  this.user.isLoggedIn = true;
}

logOut() {
  this.user.isLoggedIn = this.isLoggedIn();
}

isLoggedIn(){
  return this.authService.isLogin()
}
pledge(){
  this.router.navigate(['/pledge'])
}
redeem(){
  this.router.navigate(['/redeem'])
}
search(){
  this.router.navigate(['/search'])
}
settings(){
  this.router.navigate(['/setting'])
}
logout(){
  this.router.navigate(['/logout'])
}
home(){
  this.router.navigate(['/login'])
}
jewellery(){
  this.router.navigate(['/rough'])
}
// onRightClick(event: MouseEvent): void {
//   event.preventDefault(); // Prevent the default context menu
//   console.log('Right click detected');
//   // Navigate to a specific route
//   this.router.navigate(['/jewellery']);
// }

onLeftClick(event: MouseEvent): void {
  console.log('Left click detected');
  }
stockAddition(){
  this.router.navigate(['/stockAddition'])
}
}
