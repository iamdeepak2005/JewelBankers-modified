import { Component , OnInit,Renderer2, ViewChild } from '@angular/core';
import {ChangeDetectionStrategy} from '@angular/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {provideNativeDateAdapter} from '@angular/material/core';
import {MatIconModule} from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import {MatSelectModule} from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {AsyncPipe} from '@angular/common';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {default as _rollupMoment} from 'moment';
import { HttpClient, HttpClientModule } from '@angular/common/http';

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'LL',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
@Component({
  selector: 'app-pledge',
  standalone: true,
  imports: [MatAutocompleteModule,HttpClientModule,AsyncPipe,CommonModule, RouterModule, ReactiveFormsModule,MatFormFieldModule, MatInputModule, MatDatepickerModule,MatIconModule,MatNativeDateModule,MatSelectModule],
  templateUrl: './add-customer.component.html',
  styleUrl: './add-customer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush 
})


export class AddCustomerComponent implements OnInit {

    billform : FormGroup;
    isBillSerialDisabled = true;
    selectedCustomer: Data | undefined;

    
    constructor(private fb: FormBuilder, private router: Router,private http:HttpClient,private renderer: Renderer2) {
      this.billform = this.fb.group({
        name: [''],
        customerid: ['', [ Validators.maxLength(8)]],
        adrress: ['', []],
        Relationship: ['', []],
        relationname: ['', []],
        phone:[''],
        email:['',[]],
        area:['',[]],
        street:['',[]],
        country:['',[]],
        pincode:['',[]],
        district:['',[]]

        
      });
      
      
      
    }
    transcript = '';
    myControl = new FormControl('');
    options: Data[]=[];
    filteredOptions: Observable<string[]>|undefined ;
    
    
    ngOnInit() {
      this.billform.patchValue({country:'India'})
      this.billform.patchValue({pincode:'603103'})
      this.billform.patchValue({district:'Chengalpetu'})
      this.filteredOptions = this.myControl.valueChanges.pipe(
        startWith(""),
        map(value => this._filter(value || '')),
      );
      this.fetch();


        }

    private _filter(value: string): string[] {
      const filterValue = value.toLowerCase();
      // Filter options based on customerName and map to an array of strings
      return this.options.filter(option => option.customerName.toLowerCase().includes(filterValue))
                         .map(filteredOption => filteredOption.customerName);
    }
    
    onSubmit(form:any) {
      if (this.billform.valid) {
      const address = `${this.billform.value.area}, ${this.billform.value.street}, ${this.billform.value.country}, ${this.billform.value.pincode}`;
      this.billform.patchValue({ Address: address });
      console.log('Form submitted');
      console.log(this.billform.value);
      this.router.navigate(["/pledge"])
      }
      
  }
    fetch() {
      this.http.get<Data[]>('https://localhost:443/jewelbankersapi/customers').subscribe(
        (resp) => {
          //console.log(resp);
          this.options = resp.map(customer => ({
            ...customer,
            address: `${customer.address}, ${customer.street}, ${customer.district}, ${customer.country} - ${customer.pincode}`
          
          }));
        },
        (error) => {
          console.error('Error fetching data:', error);
        }
      );
    }
  
    displayFn(customer: Data): string {
      return customer && customer.customerName ? customer.customerName : '';
    }   

  
    onCustomerSelected(customerName: string) {
      console.log('called')
      const selectedCustomer = this.options.find(option => option.customerName === customerName);
      if (selectedCustomer) {
        const address1 = `${selectedCustomer.street}, ${selectedCustomer.district}, ${selectedCustomer.country} - ${selectedCustomer.pincode}`;
        this.billform.patchValue({ adrress: address1 });
        console.log(address1)
        this.billform.patchValue({ customerid: selectedCustomer.id });
        this.billform.patchValue({ phone: selectedCustomer.id });
      }
    }
    
    // Example function to toggle disabled state
toggleBillSerialInput() {
  this.isBillSerialDisabled = !this.isBillSerialDisabled;
}


 
  }    
  
    interface Data {
      id: any;
      area: any;
      email: any;
      phone: any;
      pincode: any;
      customerName: any;
      street: any;
      district: any;
      country: any;
      relationShip: any;
      relationShipName: any;
      address?:any;
    }
    interface Window {
  webkitSpeechRecognition: any;
}
