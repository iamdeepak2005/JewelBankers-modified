import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppComponent } from '../app.component';
import { HeaderComponent } from "../header/header.component";
import { UserService } from '../user.service';

@Component({
  selector: 'app-roughprint',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MatInputModule,
    MatAutocompleteModule,
    MatFormFieldModule, HeaderComponent],
  templateUrl: './roughprint.component.html',
  styleUrl: './roughprint.component.css'
})
export class RoughprintComponent {
  constructor(private appComponent:AppComponent,private userService:UserService) {
    this.appComponent.AI=true
  }
  itemName: string = '';
  itemNames: string[] = [];
  filteredItemNames: string[] = [];
  goldRate :any; // Example gold rate per gram
  silverRate :any; // Example silver rate per gram
  gst = 1.5; // Percentage
  sgst = 1.5; // Percentage
  gsta = 0; // Percentage
  sgsta = 0; // Percentage
  grossTotalAmount :any;
  netTotalAmount:any
  weight: any;
  makingCharges: any;
  shopName: any;
  @ViewChild('itemFocus', { static: false }) itemFocus!: ElementRef;
  
  rate: any;
  currentDate!: Date;
  private intervalId: any;
  ngOnInit(): void {
    setTimeout(() => {
      this.itemFocus.nativeElement.focus()
      
    }, 0);
    this.shopName=localStorage.getItem('shopName')
    const storedItemNames = localStorage.getItem('itemNames');
    this.itemNames = storedItemNames ? JSON.parse(storedItemNames) : [];
    this.filteredItemNames = this.itemNames; // Initially show all items
    this.currentDate=new Date()
    this.article="gold"
    const hasReloaded = sessionStorage.getItem('hasReloaded3');
    
    if (!hasReloaded) {
      // Mark as reloaded in sessionStorage
      sessionStorage.setItem('hasReloaded3', 'true');
      this.goldRate=localStorage.getItem("gold")
      this.silverRate =localStorage.getItem("silver")
  
      
      // Reload the page
     // window.location.reload();
    }
    else{
      this.goldRate=localStorage.getItem("goldRate")
      this.silverRate =localStorage.getItem("silverRate")  
    }

    this.intervalId = setInterval(() => {
      this.updateDate();
    }, 60000);  }  
  itemname:any
  article:any

  calculateTotal(weight: number, makingCharges: number,article:any,gsta:any,sgsta:any,goldRate:any,silverRate:any): void {
    if(article=="gold"){
      this.rate=this.goldRate
    }
    else if(article=="silver"){
      this.rate=this.silverRate
    }
    else{

    }
    if (parseInt(this.makingCharges) && parseInt(this.weight)){
      this.grossTotalAmount=(parseInt(this.rate)*parseInt(this.weight))+parseInt(this.makingCharges)
    }
    else if(parseInt(this.makingCharges) && !parseInt(this.weight)){
      this.grossTotalAmount=parseInt(this.makingCharges)
    }
    else if(!parseInt(this.makingCharges) && parseInt(this.weight)){
      this.grossTotalAmount=(parseInt(this.rate)*parseInt(this.weight))
    }

    const gst=parseInt(this.grossTotalAmount)*1.5/100
    this.netTotalAmount=(gst*2)+parseInt(this.grossTotalAmount)
    this.gsta=this.sgsta=gst
  }
  private updateDate(): void {
    this.currentDate = new Date();
  }
  filterItemNames(): void {
    const query = this.itemName.toLowerCase();
    this.filteredItemNames = this.itemNames.filter(item =>
      item.toLowerCase().includes(query)
    );
  }
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'p') {
      this.printPreview(); // Trigger the function when Ctrl + P is pressed
      event.preventDefault(); // Optional: Prevents the print dialog from showing automatically
    }
    else if  (event.ctrlKey && event.key === 'r') {
      this.resetPreview(); // Trigger the function when Ctrl + P is pressed
      event.preventDefault(); // Optional: Prevents the print dialog from showing automatically
    }
  }

  // Method to handle the selection of an item
  onItemSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedItem = event.option.viewValue;
    console.log('Item selected:', selectedItem);
    this.itemName = selectedItem; // Optionally update the input with the selected item
  }
  // Update filtered list whenever the user types
  onInputChange(): void {
    this.filterItemNames();
  } 
  printPreview() {
    const printContent = document.querySelector('.print-preview')!.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
    localStorage.setItem('goldRate', this.goldRate.toString());
    localStorage.setItem('silverRate', this.silverRate.toString());
    this.addItemToLocalStorage(this.itemName) // Store array as string
    localStorage.setItem('shopName', this.shopName);
    // this.itemNames = JSON.parse(localStorage.getItem('itemNames') || '[]');

    
  }
  resetPreview(){
    this.itemName=""
    this.weight=""
    this.makingCharges=""
    this.article="gold"



  }
  addItemToLocalStorage(newItem: string) {
    // Retrieve itemNames from localStorage
    let itemNames: string[] = JSON.parse(localStorage.getItem('itemNames') || '[]');
  
    // Check if the new item is already in the array
    if (!itemNames.includes(newItem)) {
      // If the item is unique, add it to the array
      itemNames.push(newItem);
  
      // Store the updated array in localStorage
      try{
      localStorage.setItem('itemNames', JSON.stringify(itemNames));
      }          catch (error) {
  this.userService.handleStorageError(error);
}    } else {
      console.log(`Item "${newItem}" already exists in the list.`);
    }
  }
  
}
