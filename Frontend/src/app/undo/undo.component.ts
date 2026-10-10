import { Component } from '@angular/core';
import {ChangeDetectionStrategy} from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {provideNativeDateAdapter} from '@angular/material/core';
import {MatIconModule} from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import * as _moment from 'moment';
import {} from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import {default as _rollupMoment} from 'moment';

@Component({
  selector: 'app-undo',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule,MatFormFieldModule, MatInputModule, MatDatepickerModule,MatIconModule,MatNativeDateModule,MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,  templateUrl: './undo.component.html',
  styleUrl: './undo.component.css'
})
export class UndoComponent {
  redeemform : FormGroup;
  
  
  constructor(private fb: FormBuilder, private router: Router) {
    this.redeemform = this.fb.group({
      billSerial: ['', [Validators.required, Validators.maxLength(2)]],
      billno: ['', [Validators.required, Validators.maxLength(5)]],
      name: ['', [Validators.required, Validators.maxLength(21)]],
      customerid: ['', [Validators.required, Validators.maxLength(8)]],
      adrress: ['', [Validators.required]],
      article: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.maxLength(8)]],
      weight: ['', [Validators.required, Validators.maxLength(5)]],
      quantity: ['', [Validators.required, Validators.maxLength(3)]],
      description: ['', [Validators.required]],
      presentvalue: ['', [Validators.required, Validators.maxLength(8)]],
      roi: ['', [Validators.required, Validators.maxLength(3)]],
      date: ['', [Validators.required]],
      AmountInWords: ['', [Validators.required]],
      redeemdate: ['', [Validators.required]],
      total: ['', [Validators.required]],
      intrest: ['', [Validators.required]],
      redeemserial: ['', [Validators.required]],
      redeemno: ['', [Validators.required]]
    });
  }


  onSubmit(form:any) {
    if (this.redeemform.valid) {
    console.log('Form submitted')
    console.log(this.redeemform.value);
    this.router.navigate(["/login"])
    }
  }

}
