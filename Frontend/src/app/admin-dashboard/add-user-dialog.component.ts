import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl, FormsModule } from '@angular/forms';
import { UserService } from '../user.service';

@Component({
  selector: 'app-add-user-dialog',
  templateUrl: './add-user-dialog.component.html',
  standalone: false,
  styles: `
  .box{
    padding:20px;
  }
    mat-form-field {
      display: block;
      width: 100%;
    }

    label {
      display: block;
      margin: 10px 0;
    }
  `
})
export class AddUserDialogComponent {
  addUserForm: FormGroup;
  status:boolean=false;
  roles = ['user', 'admin'];
  checkboxValues :any = []; // Array to store checked checkbox values
  checkboxControl = new FormControl(); 

  constructor(
    public dialogRef: MatDialogRef<AddUserDialogComponent>,
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.checkboxControl.setValue(this.checkboxValues);
    this.addUserForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      username: ['', [Validators.required]],
      status: new FormControl(false) ,
      whatsapp:new FormControl(false),
      roles: this.fb.array([]), // Initialize roles as a FormArray,
      databaseName:['']
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
  updateWhatsapp(){
    const currentWhatsapp = this.addUserForm.value.whatsapp;

    const newWhatsapp= !currentWhatsapp;

    // Set the new status value
    this.addUserForm.get('whatsapp')?.setValue(newWhatsapp);

    console.log('Status updated:', newWhatsapp);

  }

  onCheckboxChange(e: any) {
    const rolesArray: FormArray = this.addUserForm.get('roles') as FormArray;
  
    if (e.target.checked) {
      rolesArray.push(this.fb.control(e.target.value));
    } else {
      const index = rolesArray.controls.findIndex(x => x.value === e.target.value);
      rolesArray.removeAt(index);
    }
  }
  
  updateCheckbox(value: string, isChecked: any) {
    console.log(isChecked.target.value);
    
    if (isChecked.target.checked) {
      // Add to array if checked
      this.checkboxValues.push(isChecked.target.value);
    } else {
      // Remove from array if unchecked
      const index = this.checkboxValues.indexOf(isChecked.target.value);
      if (index !== -1) {
        this.checkboxValues.splice(index, 1);
      }
    }
    // Update form control value with the updated array
    this.checkboxControl.setValue(this.checkboxValues);
  }
  updateStatus() {
    // Get the current status
    const currentStatus = this.addUserForm.value.status;

    // Toggle the status
    const newStatus = !currentStatus;

    // Set the new status value
    this.addUserForm.get('status')?.setValue(newStatus);

    // Log the updated status
    console.log('Status updated:', newStatus);
  }
  onSubmit(): void {
    console.log('in add')
    if (this.addUserForm.valid) { 
      console.log('bhai validate karna sikhle ')
      const userData = {
        email: this.addUserForm.value.email,
        password: this.addUserForm.value.password,
        username: this.addUserForm.value.username,
        status: this.addUserForm.value.status , // Conditional check for status
        whatsapp:this.addUserForm.value.whatsapp,
        roles: this.checkboxValues,
        userDatabaseName:this.addUserForm.value.databaseName
      };
      this.dialogRef.close(userData);
      console.log(userData);
      this.userService.addUser(userData);
    } else {
      console.log("Form not valid");
      // Handle form validation errors as needed
    }
  }
}