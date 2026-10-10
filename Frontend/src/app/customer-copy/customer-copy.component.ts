import { Component, Inject, OnDestroy, Renderer2 } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { customTotal } from '../pledge/customTotal';
import { MatLabel } from '@angular/material/form-field';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-customer-copy',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTableModule,MatLabel,MatTooltip,MatIconModule],
  templateUrl: './customer-copy.component.html',
  styleUrls: ['./customer-copy.component.css'] // Notice it is 'styleUrls' not 'styleUrl'
})
export class CustomerCopyComponent implements OnDestroy  {
  dataSource: MatTableDataSource<customTotal>;
  total:any

  displayedColumns: string[] = [
    'billSerial', 
    'billNo', 
    'billDate', 
    'amount',
    'weight', 
    'productDescription', 
    'interest', 
    'total'
  ];
  intrest: any;
  private listener: (() => void) | undefined;

  constructor(private renderer: Renderer2,
    public dialogRef: MatDialogRef<CustomerCopyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any // Injected data
  ) {
    this.listener = this.renderer.listen('document', 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        console.log('Tab key pressed globally using Renderer2');
        this.onNoClick();
      }
    })
this.intrest = Array.isArray(data) 
    ? data.reduce((accumulator: number, currentValue: any) => accumulator + (currentValue.interest || 0), 0) 
    : 0;

this.total = Array.isArray(data) 
    ? data.reduce((accumulator: number, currentValue: any) => accumulator + (currentValue.total || 0), 0) 
    : 0;
    this.dataSource = new MatTableDataSource<customTotal>([]);
    if (data) {
      this.dataSource.data = data;
    }
  }
  onTabPress(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      this.onNoClick(); // Call onNoClick when the Tab key is pressed
    }
  }
  onNoClick(): void {
    this.dialogRef.close(false); // Close dialog and return 'false'
  }
  truncateText(text: string, maxLength: number): string {
    if (!text) {
      return ''; // Return empty if text is undefined or null
    }
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }
  ngOnDestroy(): void {
    if (this.listener) {
      this.listener();
    }
  }
  

  onYesClick(): void {
    this.dialogRef.close(true); // Close dialog and return 'true'
  }
}
