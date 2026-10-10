import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-redeem-copy',
  standalone: true,
  imports: [],
  templateUrl: './redeem-copy.component.html',
  styleUrl: './redeem-copy.component.css'
})
export class RedeemCopyComponent {
  constructor(public dialogRef: MatDialogRef<RedeemCopyComponent>) {}

  onYesClick(): void {
    this.dialogRef.close(true); // Close with true on Yes
  }

  onNoClick(): void {
    this.dialogRef.close(false); // Close with false on No
  }
}
