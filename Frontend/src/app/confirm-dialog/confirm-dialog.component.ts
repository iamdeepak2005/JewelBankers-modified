import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { Bill } from '../pledge/Bill';
import { BillDetail } from '../pledge/BillDetails';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule,MatIconModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'] // Corrected from 'styleUrl'
})
export class ConfirmDialogComponent {

bill:any
isPhoto: boolean=false;
photoPreview:any
photoPreview1:any
redeemStatus: any;
  constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>,@Inject(MAT_DIALOG_DATA) public data: Bill){
    console.log('From billlll  dialogue component billl',data)
  }
  ngOnInit() {
    console.log('Data received in ngOnInit:', this.data);
    this.bill=this.data
    const customerPhoto=this.getImageUrl(this.bill.customer.photoBase64)
    if(customerPhoto){
      this.isPhoto=true
      this.photoPreview=customerPhoto
    }
    const articlePhoto=this.getImageUrl(this.bill.billDetails.articlephoto)
    this.photoPreview1=articlePhoto
    this.redeemStatus=this.bill.redemptionStatus
  }
  onTabPress(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      this.onNoClick(); // Call onNoClick when the Tab key is pressed
    }
  }
  onNoClick(): void {
    this.dialogRef.close(false); // Close dialog and return 'false'
  }
  getImageUrl(base64String: string, imageType = 'jpeg'): string {
    return `data:image/${imageType};base64,${base64String}`;
  }
  getProductDescriptions(billDetails: BillDetail[]): string {
    let descriptions = '';
  
    for (const billDetail of billDetails) {
      descriptions += billDetail.productDescription + ' '; // Append each description with a space
    }
  
    return descriptions.trim(); // Trim any extra space at the end
  }

  onYesClick(): void {
    this.dialogRef.close(true); // Close dialog and return 'true'
  }
}
