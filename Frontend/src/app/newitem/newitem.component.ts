import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../user.service';

@Component({
  selector: 'app-newitem',
  standalone: true,
  imports: [ReactiveFormsModule,
    MatLabel,
    MatIconModule,
  ],
  templateUrl: './newitem.component.html',
  styleUrl: './newitem.component.css'
})
export class NewitemComponent {
  itemForm!: FormGroup;
  constructor(private fb: FormBuilder,private dialogRef:MatDialogRef<NewitemComponent>,private userService:UserService,@Inject(MAT_DIALOG_DATA) public data: any) { 
    console.log('from component item new ',data);
    this.itemForm = this.fb.group({
      itemType: this.fb.group({
        id: [data?.itemType?.id || ''],  // Ensure data.itemType is not undefined
        code: [data?.itemType?.code || '', Validators.required],
        description: [data?.itemType?.description || '', Validators.required],
        currentrate: [data?.itemType?.currentrate || '', Validators.required],
        gstpercentage: [data?.itemType?.gstpercentage || '', Validators.required],
        gstmakingpercentage: [data?.itemType?.gstmakingpercentage || '', Validators.required],
      }),
      name: [data?.name || '', Validators.required],
      type: [data?.type || '', Validators.required],
      weight: [data?.weight || '', [Validators.required, Validators.min(0)]],
      purity: [data?.purity || '', [Validators.required, Validators.min(0)]],
      quantity: [data?.quantity || '', [Validators.required, Validators.min(0)]],
    });
  }
  onSubmit(): void {
    if (this.itemForm.valid) {
      console.log('Form submitted with values:', this.itemForm.value);
      this.userService.createItem(this.itemForm.value).subscribe((resp:any)=>{
        console.log(resp);
      })
    } else {
      console.log('Form is invalid');
    }
  }
  onNoClick(){
    this.dialogRef.close(); 
  }
}
