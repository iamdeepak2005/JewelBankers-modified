import {Component, OnChanges, OnInit,Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';

import {ChangeDetectionStrategy} from '@angular/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {provideNativeDateAdapter} from '@angular/material/core';
import {MatIconModule} from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import {MatSelectModule} from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule, JsonPipe } from '@angular/common';
import {Observable, of, Subscription, throwError} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import {AsyncPipe} from '@angular/common';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {default as _rollupMoment} from 'moment';
import { Injectable } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Bill } from '../pledge/Bill';
import { UserService } from '../user.service';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import { AfterViewInit, ElementRef } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { MatSnackBar } from '@angular/material/snack-bar';
import { Customer } from '../add-customer/Customer';
import { AuthService } from '../auth.service';
import { BillDetail } from '../pledge/BillDetails';
import { runInThisContext } from 'vm';
import { LoaderComponent } from "../loader/loader.component";
import { LocalStorageService } from '../local-storage.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [MatTableModule,ScrollingModule, MatAutocompleteModule, HttpClientModule, AsyncPipe, CommonModule, RouterModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatIconModule, MatNativeDateModule, MatSelectModule, HeaderComponent, FooterComponent, FormsModule, LoaderComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
})
export class SearchComponent implements OnInit,AfterViewInit,OnChanges {
  @ViewChild('myInput') myInputElement!: ElementRef;
  searchForm: FormGroup;
  bills!: Bill[];
  //dataSource = this.bills;
  dataSource!: MatTableDataSource<any> ;//= new MatTableDataSource<any>([]); // Initialize with an empty array
  isSearchDate=false
  isSearchDateAlso=false

  // bills: Bill[] = [];  
  isBillSerialDisabled = true;
  selectedCustomer: Data | undefined;
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  viewportHeight: number = 600; // Set appropriate height for your viewport

  filterForm: FormGroup;
  transcript = '';
  myControl = new FormControl('');
  options: any[] = [];
  filteredOptions: Observable<string[]> | undefined;
  unSearched=true
  url=""
  data:any
  displayedColumns: string[] = ['billSerial', 'billNo', 'billDate', 'customerName', 'address', 'grams', 'amount', 'productDescription', 'RedeemNO', 'redemptionDate','actions'];
  rangeGroup: any;
  productTypes: any;
  products: any;
  productOptions: any;
  private storageSubscription: Subscription |undefined;
  public storageValue: any;
  load: boolean=false;
  constructor(
    private fb: FormBuilder,
    private localStorageService: LocalStorageService,
    private router: Router,
    private http: HttpClient,
    private renderer: Renderer2,
    private userService: UserService ,
    private snackBar:MatSnackBar,
    private route: ActivatedRoute ,private authService: AuthService) {
    this.dataSource = new MatTableDataSource<Bill>();
    this.searchForm = this.fb.group({
      search: [''],
      myControl: this.myControl, // Bind the form control to the form grou


    });
    this.filterForm = this.fb.group({
      productTypeno: ['A'],
      status: ['A']
    });

    this.range = this.fb.group({
      start: [null as Date | null],
      end: [null as Date | null]
    });
    this.load=true
    
      this.http.get(`${this.userService.apiUrl}bills?size=`,this.userService.get_httpHeader()).subscribe((resp:any)=>{
        this.load=false

      console.log(resp)
      this.dataSource.data=resp.content
    })
    console.log(this.data)
  }
  ngAfterViewInit() {
    this.myInputElement.nativeElement.focus();
  }
  trackByFn(index: number, item: any): any {
    return item.id; // or whatever unique identifier your options have
  }
    ngOnChanges(changes: SimpleChanges): void {
      console.log('Route is reused or changed:', this.currentRoute);

      if (changes['route']) {
        // Do something when route changes or reuse occurs
        console.log('Route is reused or changed:', this.currentRoute);
      }
    }
  currentRoute: string | null = null;


  ngOnInit() {
        // Subscribe to the localStorage observable to receive updates
        this.storageSubscription = this.localStorageService.getStorage().subscribe((value) => {
          this.storageValue = value;
          console.log('Updated localStorage value:', this.storageValue);
        });
    this.currentRoute = this.route.snapshot.routeConfig?.path || null;
        console.log("INitialized....................")

    this.fetchProductTypes()
    this.userService.getProductTypes().subscribe((resp:any)=>{
      this.productTypes=resp
      console.log(resp)
    })
    this.searchForm.patchValue({ 
      billserial: 'B',
      // productTypeno:'A',
      // status:'A'

     });
     console.log('nwjsbvjbnrejbzjdfnbzz cnb gf zkxndjvbskjdnvhjzbsdhgvgbhjnk...............',this.searchForm.get('productTypeno')?.value)
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => this._filter(value || '')), 
    );

    //this.data = history.state.data;
    const storedDataVoice = localStorage.getItem('responseDataVoice');
    console.log('in pledge component.ts stored voice data', storedDataVoice);
    
    if (storedDataVoice) {
      try {
        const parsedDataVoice = JSON.parse(storedDataVoice);  // Parse only if the data is a valid JSON string
        console.log("Parsed response data:", parsedDataVoice);  // Log the entire object
        console.log("Customer Name:", parsedDataVoice?.customer_name);  // Log customer_name specifically
        this.patchFormValues(parsedDataVoice)
        localStorage.removeItem('responseDataVoice')

      } catch (error) {
        console.error("Error parsing response data:", error);
      }
    } else {
      console.log('No response data found in local storage.');
    }

  }
  ngOnDestroy(){
    console.log("Destroyed............................................")
  }
  patchFormValues(data: any) {
    if (data) {
      // Clean the 'others' value by removing unwanted characters and trim any extra spaces
      const new12 = (data.others ? data.others.replace(/[.,₹$]|rs/g, '').trim() : '');
  
      // Get customer name and trim spaces
      const customerName = data.customer_name ? data.customer_name.trim() : '';
  
      // Combine customer name and cleaned 'others' value, then trim the result
      const val = (customerName + ' ' + new12).trim();
  
      // Patch the form value with the trimmed result
      this.searchForm.patchValue({
        myControl: val
      });
    } else {
      // If data is null or undefined, patch the bill_number and trim spaces
      this.searchForm.patchValue({
        myControl: (data.bill_number || '').trim()
      });
    }
  
    // Clear the localStorage data for 'responseDataVoice'
    localStorage.removeItem('responseDataVoice');
  }
  private _filter(value: string): Observable<string[]> {
    const input = value.trim().toLowerCase();
    if (input === '') {
      return of([]);
    }

    if (value.includes(':')) {
      return of([value]);
    }

    // Check if the input is numeric (e.g., phone number search)
    const isNumeric = /^\d+$/.test(input);

    if (isNumeric) {
      // Fetch filtered customer records by phone from the API
      return this.userService.getCustomerByPhone(input).pipe(
        map((resp: Customer[]) => {
          console.log(resp);
          let filteredOptions: string[] = [];

          if (resp && resp.length > 0) {
            // Extract phone/mobile numbers and customer names, formatted as "phoneNumber : customerName"
            filteredOptions = resp.map(customer => {
              const phone = (customer.phoneno || customer.mobileno || '').toString();
              const name = customer.customerName || '';
              return `${phone} : ${name}`;
            }).filter(option => option.toLowerCase().includes(input));
          }

          if (filteredOptions.length === 0 && value) {
            filteredOptions.push(value);
          }
          return filteredOptions;
        }),
        catchError((error) => {
          console.error('Error fetching customer phone data:', error);
          return of([value]);
        })
      );
    } else {
      // Normal search by name/address
      return this.userService.getCustomersByName(input).pipe(
        map((resp: Customer[]) => {
          console.log(resp);
          let filteredOptions: string[] = [];

          if (resp && resp.length > 0) {
            const customerNames = resp.map(customer => customer.customerName?.toLowerCase() || '');
            filteredOptions = customerNames
              .filter(option => option.includes(input))
              .map(option => option.toUpperCase());
          }

          if (filteredOptions.length === 0 && value) {
            filteredOptions.push(value.toUpperCase());
          }
          return filteredOptions;
        }),
        catchError((error) => {
          console.error('Error fetching customer name data:', error);
          return of([value.toUpperCase()]);
        })
      );
    }
  }
  

  validateBill(input: string): boolean {
    const regex = /^[a-zA-Z]\d{4,5}$/;
    return regex.test(input);
  }
  toggle(){
    console.log("isSearchDate"+this.isSearchDate);
    this.isSearchDate=!this.isSearchDate
    this.isSearchDateAlso=false
  }
  toggle1(){
    console.log("isSearchDate"+this.isSearchDateAlso);
    this.isSearchDateAlso=!this.isSearchDateAlso
    this.isSearchDate=false
  }
  onActionClick(bill:any){
    console.log(bill)
    const baseUrl = `${this.userService.apiUrl}generate-auction-pdf?search=${bill.billSerial}${bill.billNo}`;
    this.userService.generateAuctionPdf(baseUrl).subscribe((response: any) => {
      // this.snackBar.open(response, 'Close', {
      //   duration: 3000,
      //   verticalPosition: 'bottom',
      //   panelClass:['searchSnackbar']
      // });
      
      const blob = new Blob([response], { type: 'application/pdf' });
      const pdfUrl = window.URL.createObjectURL(blob);
      window.open(pdfUrl);
      window.URL.revokeObjectURL(pdfUrl);  // Clean up after download
    }, error => {
      console.error('Error downloading the PDF file', error);
    });
  }
  formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  // createUrl(need:string,params: { amount: number | null, name: string | null, article: string | null, billNumber: string | null, redeem: boolean, open: boolean }): string {
  //   // Base URL
  //   const baseUrl = `${this.userService.apiUrl}${need}?`;
    
  //   // Initialize an array to hold query parameters
  //   const queryParams: string[] = [];
  
  //   // Include amount if it's not 0 or null
  //   if (params.amount !== 0 && params.amount !== null) {
  //     queryParams.push(`amount=${params.amount}`);
  //   }
  
  //   // Include billNumber if it exists
  //   if (params.billNumber) {
  //     queryParams.push(`search=${encodeURIComponent(params.billNumber)}`);
  //   }
  
  //   // Include article if it exists
  //   if (params.article) {
  //     queryParams.push(`article=${encodeURIComponent(params.article)}`);
  //   }
  
  //   // Include status based on redeem and open
  //   if (params.redeem) {
  //     queryParams.push('status=R');
  //   } else if (params.open) {
  //     queryParams.push('status=O');
  //   }
  
  //   // Include name if it exists
  //   if (params.name) {
  //     queryParams.push(`search=${encodeURIComponent(params.name)}`);
  //   }
  
  //   const finalUrl = baseUrl + queryParams.join('&');
  //   return finalUrl;
  // }


getEndDate(endValue:any){
// Increment end date by one day
if (endValue) {
  const incrementedEndDate = new Date(endValue);
  incrementedEndDate.setDate(incrementedEndDate.getDate() + 1);
  endValue = incrementedEndDate;
}
return endValue;
}


getStartDate(startValue:any){
  // Increment end date by one day
  if (startValue) {
    const incrementedEndDate = new Date(startValue);
    incrementedEndDate.setDate(incrementedEndDate.getDate() + 1);
    startValue = incrementedEndDate;
  }
  return startValue;
  }

  exportBillsToExcel() {
    const startControl = this.range.get('start') as FormControl<Date | null>;
    const startValue = startControl.value;
    const endControl = this.range.get('end') as FormControl<Date | null>;
    const endValue = endControl.value;

    const Start=`${this.getStartDate(startValue)?.toISOString().split('T')[0]}`
    const endate=`${this.getEndDate(endValue)?.toISOString().split('T')[0]}`

    let url=''
    // // if (this.isSearchDate){
    // //   url=`${this.userService.apiUrl}bills/export/excel?&fromDate=${Start}&toDate=${endate}`
    // //   console.log('URL IS THIS',url)
    // // }
    // else{
      if(this.isSearchDateAlso){
        console.log(Start)
        if(Start!=undefined){
          url=this.createUrl('bills/export/excel',this.parseInput(this.myControl.value))
          url=url+`&fromDate=${Start}&endDate=${endate}`
          console.log('URL IS THIS',url)
        }
        else{
          url=this.createUrl('bills/export/excel',this.parseInput(this.myControl.value))
          console.log('URL IS THIS',url)
        }
      }
      else{
        url=this.createUrl('bills/export/excel',this.parseInput(this.myControl.value))
        console.log('URL IS THIS',url)
      }
    
    this.userService.exportBillsToExcel(url).subscribe((response: any) => {
      console.log('check this out . .........',response)

      let blob;
      let type=''
// Assuming you get this from the response headers
      if (response.type.includes('.xlsx')) {
        console.log('be happpy...............',response)
        blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        type='xlsx'
    }
    // For XLS format
    else {
        blob = new Blob([response], { type: 'application/vnd.ms-excel' });
        type='xls'
    }
      // const blob = new Blob([response], { type: 'application/vnd.ms-excel' });
     //const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
     
      const excelUrl = window.URL.createObjectURL(blob);
      
      // Create an anchor element and trigger the download
      const a = document.createElement('a');
      a.href = excelUrl;
      //a.download = 'bill.xlsx'; // Specify the filename here
      a.download = `bill.${type}`; // Specify the filename here
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      // Clean up the object URL
      window.URL.revokeObjectURL(excelUrl);

      
    }, error => {
      console.error('Error downloading the Excel file', error);
    });
    
    
  }

  getDateValue(value:string): string {
    const startControl = this.range.get(value) as FormControl<Date | null>;
    return startControl.value ? startControl.value.toISOString().split('T')[0] : ''; // Format as YYYY-MM-DD
  }




  onSubmit(form: FormGroup) {4
    const startControl = this.range.get('start') as FormControl<Date | null>;
    const startValue = startControl.value;
    const endControl = this.range.get('end') as FormControl<Date | null>;
    const endValue = endControl.value;

    const Start=`${this.getStartDate(startValue)?.toISOString().split('T')[0]}`
    const endate=`${this.getEndDate(endValue)?.toISOString().split('T')[0]}`

    //const Start=`${startValue?.toISOString().split('T')[0]}`
    //const endate=`${endValue?.toISOString().split('T')[0]}`
    console.log('SEE HEREEEE:',Start,endate);    
    if (this.searchForm.valid) {
    let url=''
    // if (this.isSearchDate){
    //   url=`${this.userService.apiUrl}bills/fullsearch?&fromDate=${Start}&toDate=${endate}`
    //   console.log('URL IS THIS',url)
    // }
    // else{
      if(this.isSearchDateAlso){
        console.log(Start)
        if(Start!=undefined){
          url=this.createUrl('bills/fullsearch',this.parseInput(this.myControl.value))
          url=url+`&fromDate=${Start}&toDate=${endate}`
          console.log('URL IS THIS',url)
        }
        else{
          url=this.createUrl('bills/fullsearch',this.parseInput(this.myControl.value))
          console.log('URL IS THIS',url)
        }
      }
      else{
        url=this.createUrl('bills/fullsearch',this.parseInput(this.myControl.value))
        console.log('URL IS THIS',url)
      }

    
    this.http.get(url, this.userService.get_httpHeader())
    .pipe(
      catchError(this.handleError) // Handle errors here
    )
    .subscribe(
      (response: any) => {
        if (response.message) {
          this.snackBar.open('No bills found', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
            panelClass:['searchSnackbar']
          });
          console.log('Bill details:', response);
          this.dataSource.data = [];
        } else {
          console.log('Bills found:', response);
          this.dataSource.data = response;

          
        }
      },
      (error) => {
        this.handleError(error)

        console.error('Error fetching bills:', error); // Handle the error in the subscription
      }
    );
}
}
private handleError(error: HttpErrorResponse){
  if (error.status === 500) {
    this.snackBar.open('Server error. Please try again later.', 'Close', {
      duration: 3000,
      verticalPosition: 'bottom',
    });
  } else {
    this.snackBar.open('An error occurred. Please try again.', 'Close', {
      duration: 3000,
      verticalPosition: 'bottom',
    });
  }
  console.error('Error status:', error.status);
  return throwError(() => error); // Rethrow the error
}
  


  generateAuctionPdf(){
    const startControl = this.range.get('start') as FormControl<Date | null>;
    const startValue = startControl.value;
    const endControl = this.range.get('end') as FormControl<Date | null>;
    const endValue = endControl.value;

    const Start=`${this.getStartDate(startValue)?.toISOString().split('T')[0]}`
    const endate=`${this.getEndDate(endValue)?.toISOString().split('T')[0]}`

    //const Start=`${startValue?.toISOString().split('T')[0]}`
    //const endate=`${endValue?.toISOString().split('T')[0]}`

    let url=''
    // if (this.isSearchDate){
    //   url=`${this.userService.apiUrl}generate-auction-pdf?&fromDate=${Start}&toDate=${endate}`
    //   console.log('URL IS THIS',url)
    // }
    // else{
      if(this.isSearchDateAlso){
        console.log(Start)
        if(Start!=undefined){
          url=this.createUrl('generate-auction-pdf',this.parseInput(this.myControl.value))
          url=url+`&fromDate=${Start}&toDate=${endate}`
          console.log('URL IS THIS',url)
        }
        else{
          url=this.createUrl('generate-auction-pdf',this.parseInput(this.myControl.value))
          console.log('URL IS THIS',url)
        }
      }
      else{
        url=this.createUrl('generate-auction-pdf',this.parseInput(this.myControl.value))
        console.log('URL IS THIS',url)
      }
    
    this.userService.generateAuctionPdf(url).subscribe((response: any) => {
      // this.snackBar.open(response, 'Close', {
      //   duration: 3000,
      //   verticalPosition: 'bottom',
      //   panelClass:['searchSnackbar']
      // });
      
      const blob = new Blob([response], { type: 'application/pdf' });
      const pdfUrl = window.URL.createObjectURL(blob);
      window.open(pdfUrl);
      window.URL.revokeObjectURL(pdfUrl);  // Clean up after download
    }, error => {
      console.error('Error downloading the PDF file', error);
    });
  }
  customer=false
  amount=false
  date=false
  redeem=false
  open=false

  
  checkJsonFieldsWithValues(parsedData: any): Record<string, any> {
    // Define the flags with their values from parsed data
    const flagsWithValues = {
      customer: parsedData.customer || undefined,
      amount: parsedData.amount || undefined,
      date: undefined, // Not available in the input
      redeem: parsedData.status === 'redeemed' ? parsedData.status : undefined,
      open: parsedData.status === 'open' ? parsedData.status : undefined,
    };
  
    // Filter out keys with undefined values
    const trueFlagsWithValues = Object.fromEntries(
      Object.entries(flagsWithValues).filter(([key, value]) => value !== undefined)
    );
  
    return trueFlagsWithValues;
  }
  
// Updated createUrl method
createUrl(need: string, params: { 
  amount: number | null, 
  name: string | null, 
  article: string | null, 
  billNumber: string | null, 
  redeem: boolean, 
  open: boolean, 
  productTypeNo: number | null ,
  status:string|null,
  phoneno?: number | null

}): string {
  // Base URL
  const baseUrl = `${this.userService.apiUrl}${need}?`;
  
  // Initialize an array to hold query parameters
  const queryParams: string[] = [];

  // Include amount if it's not 0 or null
  if (params.amount !== 0 && params.amount !== null) {
      queryParams.push(`amount=${params.amount}`);
  }

  // Include billNumber if it exists
  if (params.billNumber) {
      queryParams.push(`search=${encodeURIComponent(params.billNumber)}`);
  }

  // Include article if it exists
  if (params.article) {
      queryParams.push(`article=${encodeURIComponent(params.article)}`);
  }

  // Include status based on redeem and open
  if (params.status) {
      queryParams.push(`status=${params.status}`);
  } 


  // Include name if it exists
  if (params.name) {
      queryParams.push(`search=${encodeURIComponent(params.name)}`);
  }

  // Include productTypeNo if it is not null
  if (params.productTypeNo !== null) {
      queryParams.push(`productTypeNo=${params.productTypeNo}`);
  }

  // Include phoneno if it exists
  if (params.phoneno !== undefined && params.phoneno !== null) {
      queryParams.push(`phoneno=${params.phoneno}`);
  }

  const finalUrl = baseUrl + queryParams.join('&');
  console.log('final url.....................')
  return finalUrl;
}

// Updated parseInput method
parseInput(input: string | null): {
  amount: number;
  name: string | null;
  article: string | null;
  billNumber: string | null;
  redeem: boolean;
  open: boolean;
  productTypeNo: number | null; // Add productTypeNo in the return type
  status: string | null; // Status for filtering
  phoneno: number | null; // Add phoneno to return type
} {
  const parsedResult = {
    amount: 0,
    name: null as string | null, // Allow name to be string or null
    article: null as string | null, // Allow article to be string or null
    billNumber: null as string | null, // Allow billNumber to be string or null
    redeem: false,
    open: false,
    productTypeNo: null as number | null, // Default productTypeNo is null
    status: null as string | null, // Add status field
    phoneno: null as number | null // Initialize phoneno as null
};
if (input === null) {
  console.error('Input is null');
  return parsedResult; // Return default values
}

  // Handle selected autocomplete format "phoneNumber : customerName"
  if (input.includes(':')) {
    const parts = input.split(':');
    const phonePart = parts[0].trim();
    const namePart = parts[1].trim();
    if (/^\d{7,15}$/.test(phonePart)) {
      parsedResult.phoneno = parseInt(phonePart, 10);
    }
    parsedResult.name = namePart;
    
    // Auto-apply dropdown filters if any are set
    const statusVal = this.filterForm.get('status')?.value;
    if (statusVal && statusVal !== 'A') {
      parsedResult.status = statusVal;
    }
    const articleVal = this.filterForm.get('productTypeno')?.value;
    if (articleVal && articleVal !== 'A') {
      parsedResult.productTypeNo = articleVal;
    }
    
    console.log('parsedResult from colon format:', parsedResult);
    return parsedResult;
  }

  if(this.filterForm.get('productTypeno')?.value=="A" &&this.filterForm.get('status')?.value=="A"  ){
  const parts = input.split(/\s+/);
  
  // Initialize variables for name and amount
  const nameParts: string[] = [];

  // Iterate over the parts to detect amount, name, billNumber, and product type
  for (const part of parts) {
      if (/^\d{7,15}$/.test(part)) {
          parsedResult.phoneno = parseInt(part, 10);
      } else if (/^\d+$/.test(part)) {
          // If the part is all digits, check if it fits in 32-bit signed integer
          const val = parseInt(part, 10);
          if (val <= 2147483647) {
              parsedResult.amount = val;
          } else {
              nameParts.push(part);
          }
      } else if (/^[a-zA-Z]\d{4}$/.test(part)) {
          // If the part matches a pattern like 'A6678', treat it as billNumber
          parsedResult.billNumber = part;
      } else if (part.toLowerCase() === 'redeem' || part.toLowerCase() === 'redeemed') {
          // If the part is 'redeem', set redeem to true
          parsedResult.redeem = true;
          parsedResult.status = 'R';
      } else if (part.toLowerCase() === 'open' || part.toLowerCase() === 'opened') {
          // If the part is 'open', set open to true
          parsedResult.open = true;
          parsedResult.status = 'O';
      } else if (part.toLowerCase() === 'cancel') {
          // If the part is 'cancel', set status to C
          parsedResult.status = 'C';
      } else if (part.toLowerCase() === 'gold') {
          const a = this.userService.getProductTypeNoByCode('gold'.toUpperCase(), this.productTypes);
          parsedResult.productTypeNo = a !== undefined ? a : null;
      } else if (part.toLowerCase() === 'silver') {
          const a = this.userService.getProductTypeNoByCode('silver'.toUpperCase(), this.productTypes);
          parsedResult.productTypeNo = a !== undefined ? a : null;
      } else if (part.toLowerCase() === 'watch') {
          const a = this.userService.getProductTypeNoByCode('watch'.toUpperCase(), this.productTypes);
          parsedResult.productTypeNo = a !== undefined ? a : null;
      } else if (part.toLowerCase() === 'bronze') {
          const a = this.userService.getProductTypeNoByCode('bronze'.toUpperCase(), this.productTypes);
          parsedResult.productTypeNo = a !== undefined ? a : null;
      } else if (part.toLowerCase() === 'others') {
          const a = this.userService.getProductTypeNoByCode('others'.toUpperCase(), this.productTypes);
          parsedResult.productTypeNo = a !== undefined ? a : null;
      } else {
          // Otherwise, treat the part as part of the name
          nameParts.push(part);
      }
  }

  // Join all name parts into a single string
  parsedResult.name = nameParts.join(' ');
  console.log('parsedResult will beeeee',parsedResult)

  

  }
  else if( (this.filterForm.get('productTypeno')?.value!="A" || this.filterForm.get('status')?.value!="A")&&!this.containsExcludedWords(input) ){
// Regular expressions for detecting patterns
const amountRegex = /^\d+$/; // Matches parts that are all digits (amount)
const billNumberRegex = /^[a-zA-Z]\d{4}$/; // Matches patterns like 'A6678' (billNumber)
const nameRegex = /[a-zA-Z\s]+/; // Matches alphabetic names with spaces


// Split the input by spaces
const parts = input.split(/\s+/);

// Initialize variables for name and amount
const nameParts: string[] = [];

// Iterate over the parts to detect amount, name, and billNumber
for (const part of parts) {
    if (/^\d{7,15}$/.test(part)) {
        parsedResult.phoneno = parseInt(part, 10);
    } else if (amountRegex.test(part)) {
        // If the part matches the amount pattern, check if it fits in 32-bit signed integer
        const val = parseInt(part, 10);
        if (val <= 2147483647) {
            parsedResult.amount = val;
        } else {
            nameParts.push(part);
        }
    } else if (billNumberRegex.test(part)) {
        // If the part matches the billNumber pattern
        parsedResult.billNumber = part;
    } else if (nameRegex.test(part)) {
        // If the part matches the name pattern (assuming names are alphabetic)
        nameParts.push(part);
    }
}

// Join all name parts into a single string
parsedResult.name = nameParts.join(' ');
console.log('parsedResult will beeeee', parsedResult);
if(this.filterForm.get('status')?.value=="R"){
  parsedResult.status="R"
}
if(this.filterForm.get('status')?.value=="O"){
  parsedResult.status="O"
}
if(this.filterForm.get('status')?.value=="C"){
  parsedResult.status="C"
}

const article=this.filterForm.get('productTypeno')?.value
parsedResult.productTypeNo=article
if (this.filterForm.get('productTypeno')?.value === "A") {
  // Keep productTypeNo as null (no filter)
  parsedResult.productTypeNo = null;}
  

  }
  else{
    this.snackBar.open('Choose One Method to search either by Search Bar or Drop Down', 'Close', {
      duration: 3000,
      verticalPosition: 'bottom',
      panelClass:['searchSnackbar']
    });


  }


  return parsedResult;
  // Initialize parsed result with default values
}


containsExcludedWords(input: string): boolean {
  const excludedWords = ['redeem', 'silver', 'gold', 'watch', 'others', 'open', 'cancel'];

  // Convert the input to lowercase for case-insensitive comparison and split into words
  const inputWords = input.toLowerCase().split(/\s+/);

  // Check if any of the excluded words are present in the input
  return inputWords.some(word => excludedWords.includes(word));
}
fetchProductTypes(){
  this.userService.getProductTypes().subscribe((resp:any)=>{
         console.log('here is product details', )
         this.productOptions=resp;
         this.productTypes = resp;
         this.products =  resp.map((item: { productTypeCode: any; }) => item.productTypeCode);
        //  this.billform.patchValue({
        //   productTypeNo:this.getProductTypeNo("GOLD")
        // })
 // goldProducts will now contain only the items with productTypeCode 'GOLD'
       })
}

getProductDescriptions(billDetails: BillDetail[]): string {
  let descriptions = '';

  for (const billDetail of billDetails) {
    descriptions += billDetail.productDescription + ' '; // Append each description with a space
  }

  return descriptions.trim(); // Trim any extra space at the end
}
resetForm(){
  this.myControl.patchValue('')


  this.filterForm.patchValue({
    productTypeno: 'A',
    status: 'A'
  })
  this.range.reset();


}
getPdf(){
  const startControl = this.range.get('start') as FormControl<Date | null>;
  const startValue = startControl.value;
  const endControl = this.range.get('end') as FormControl<Date | null>;
  const endValue = endControl.value;

  const Start=`${this.getStartDate(startValue)?.toISOString().split('T')[0]}`
  const endate=`${this.getEndDate(endValue)?.toISOString().split('T')[0]}`

  //const Start=`${startValue?.toISOString().split('T')[0]}`
  //const endate=`${endValue?.toISOString().split('T')[0]}`

  let url=''
  // if (this.isSearchDate){
  //   url=`${this.userService.apiUrl}generate-bill-pdf?&fromDate=${Start}&toDate=${endate}`
  //   console.log('URL IS THIS',url)
  // }
  // else{
    if(this.isSearchDateAlso){
      console.log(Start)
      if(Start!=undefined){
        url=this.createUrl('generate-bill-pdf',this.parseInput(this.myControl.value))
        url=url+`&fromDate=${Start}&toDate=${endate}`
        console.log('URL IS THIS',url)
      }
      else{
        url=this.createUrl('generate-bill-pdf',this.parseInput(this.myControl.value))
        console.log('URL IS THIS',url)
      }
    }
    else{
      url=this.createUrl('generate-bill-pdf',this.parseInput(this.myControl.value))
      console.log('URL IS THIS',url)
    }
  // }
  this.userService.generateBillPdfSearch(url).subscribe((response: Blob) => {
    const blob = new Blob([response], { type: 'application/pdf' });
    const pdfUrl = window.URL.createObjectURL(blob);
    window.open(pdfUrl);
    window.URL.revokeObjectURL(pdfUrl);  // Clean up after download
  }, error => {
    console.error('Error downloading the PDF file', error);
  });
}
}      


interface Data {
  id: any;
  area: any;
  mailid: any;
  phone: any;
  pincode: any;
  customerName: any;
  street: any;
  district: any;
  country: any;
  relationShip: any;
  relationShipName: any;
  address?: any;
}

// function saveAs(blob: Blob, arg1: string) {
//   throw new Error('Function not implemented.');
// }
