import { Component } from '@angular/core';
import { JewelleryHeaderComponent } from "../jewellery-header/jewellery-header.component";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { debounceTime, switchMap, Observable, of, map } from 'rxjs';
import {  MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-jewellery-billing',
  standalone: true,
  imports: [JewelleryHeaderComponent,ReactiveFormsModule,MatAutocompleteModule,CommonModule],
  templateUrl: './jewellery-billing.component.html',
  styleUrl: './jewellery-billing.component.css'
}) 
export class JewelleryBillingComponent {
  itemControl = new FormControl();
  filteredItemOptions!: Observable<string[]>;
  form!:FormGroup;
  constructor(private fb:FormBuilder
    ,private userService:UserService
  ) { 
    this.form=this.fb.group({
      // itemname: ['', Validators.required],
      qty: ['', Validators.required],
      grossWt: ['', Validators.required],
      stoneWt: ['', Validators.required],
      netWt: ['', Validators.required],
      purity: ['', Validators.required],
      rate: ['', Validators.required],
      amount: ['', Validators.required],
      wastage: ['', Validators.required],
      totalAmt: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.filteredItemOptions = this.itemControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => this._filterItems(value)) // Call the API filtering function
    );
  }
  onSubmit(){
    console.log(this.form.value);
  }
    private _filterItems(item: string): Observable<string[]> {  
  
      const input = item.toLowerCase().trim(); // Normalize input
      if (input === '') {
          return of([]);
      }
      return this.userService.getItembyprefix(input).pipe(
          map((resp: any[]) => {
  
              if (!resp || resp.length === 0) {
                  return [item]; 
              }
  

              const filteredOptions = resp.filter(option => option.toLowerCase().includes(input));
              return filteredOptions.length > 0 ? filteredOptions : [item];
          })
      );
  }


  trackByFn(index: number, item: any): any {
    return item.id; 
  }
  

}
