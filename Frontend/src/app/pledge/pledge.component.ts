interface Suggestion {
  name: string;
  district: string;
  state: string;
  country: string;
  fullAddress: string;
}
import { MatListModule } from '@angular/material/list';
import { ChangeDetectorRef, Component, ElementRef, HostListener, NgModule, OnDestroy, OnInit, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';
import { ChangeDetectionStrategy, NgZone } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormGroupDirective, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule, JsonPipe } from '@angular/common';
import { Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { default as _rollupMoment } from 'moment';
import { Injectable } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Bill } from './Bill';
import { get } from 'http';
import { BillDetail } from './BillDetails';
import { Customer } from '../add-customer/Customer';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { UserService } from '../user.service';
import { AfterViewInit } from '@angular/core';
import { jsPDF } from 'jspdf';
import { prototype } from 'events';
import { _setDisabled } from 'ag-grid-community';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Settings } from '../setting/setting';
import { AuthGuard } from '../auth.guard';
import { AuthService } from '../auth.service';
import { error } from 'console';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { RedeemCopyComponent } from '../redeem-copy/redeem-copy.component';
import { CustomerCopyComponent } from '../customer-copy/customer-copy.component';
import { IndexedDbService } from '../indexed-db.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { customTotal } from './customTotal';
import { AppComponent } from '../app.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-pledge',
  standalone: true,
  imports: [MatAutocompleteModule, MatTooltipModule, MatListModule, MatSnackBarModule, HttpClientModule, AsyncPipe, CommonModule, RouterModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatIconModule, MatNativeDateModule, MatSelectModule, HeaderComponent, FooterComponent, FormsModule, MatTableModule],
  templateUrl: './pledge.component.html',
  styleUrl: './pledge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],

})




export class PledgeComponent implements OnInit, AfterViewInit, OnDestroy {
  customers: Customer[] | undefined;

  officecopy = false;
  selectFiles: File | Blob | '' = ''
  selectedFile: any;
  Update = false;
  billSequence: any;
  customerTotalTable: any;
  selectFiles1: File | Blob | '' = '';
  photoPreview1: string | undefined;
  filteredSuggestions: Suggestion[] = []; // Explicit type definition
  isNewCustomer: boolean = false

  @ViewChild('addressInput', { static: true }) addressInput!: ElementRef;
  // @ViewChild('customerInput') customerInput!: ElementRef;
  @ViewChild('customerInput', { static: false }) customerInput!: ElementRef;

  @ViewChild('phoneInput', { static: false }) phoneInput!: ElementRef;
  @ViewChild('pincodeInput', { static: false }) pincodeInput!: ElementRef;
  @ViewChild('amountInput', { static: false }) amountInput!: ElementRef;





  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  video!: HTMLVideoElement; // Video DOM element
  videoDeviceId: string | undefined; // Selected video device ID
  videoDevices: any[] = []; // Available video devices
  stream: MediaStream | undefined; // MediaStream object
  isCameraActive = false; // Camera status flag
  photoPreview3: string | null = null; // Captured photo preview
  isValid: boolean = false;
  shopName: string | undefined;
  shopAddress: string | undefined;
  printForm() {
    throw new Error('Method not implemented.');
  }



  billform: FormGroup;
  isBillSerialDisabled = false;
  selectedCustomer: Customer | undefined;
  isSuccess = false;
  alertMessage = "";
  nextBillNo = 0;  // New variable to store the next bill number
  savedBillSequence = 0;
  photoPreview: string | ArrayBuffer | null = null;
  //@ViewChild('myInput') myInputElement!: ElementRef;
  selectedCustomerarr: Customer[] | undefined
  silverROI: any;
  goldROI5K: any;
  goldROI10K: any;
  goldROI15K: any;
  goldROI20K: any;
  load: boolean = false
  goldROI100Kplus: any;
  goldROI100K: any;
  goldROI50K: any;
  dataSource: MatTableDataSource<customTotal>;
  setting: any;
  productOptions: any
  productTypes: ProductTypes[] = [];
  products: any;
  ifOthers = false
  productValue: any
  data: any;
  isDate = false
  isSearchCustomer: boolean | undefined
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
  private pincodeSubject = new Subject<string>(); // Tracks pincode input
  private destroy$ = new Subject<void>(); // Handles unsubscription 


  constructor(private fb: FormBuilder, private ngZone: NgZone, private appcomp: AppComponent, private cdr: ChangeDetectorRef, private indexedDbService: IndexedDbService, private dialog: MatDialog, private route: ActivatedRoute, private router: Router, private http: HttpClient, private renderer: Renderer2, private userService: UserService, private snackBar: MatSnackBar, private authService: AuthService) {


    //[Validators.required,Validators.maxLength(31),Validators.minLength(3)]
    this.billform = this.fb.group({
      billSerial: ['', [Validators.maxLength(3)]],
      billNo: ['', [Validators.maxLength(5), Validators.required]],
      plotNo: [''],
      area: [''],

      customerid: [{ value: '', disabled: true },],
      Address: ['',],
      fullAddress: ['', [Validators.maxLength(150), Validators.required]],
      productTypeNo: [, [Validators.required]],
      amount: ['', [Validators.maxLength(8), Validators.required]],
      grams: ['', [Validators.maxLength(7), Validators.required]],
      productQuantity: ['', [Validators.required, Validators.maxLength(3)]],
      productDescription: ['',],
      presentValue: ['', [Validators.maxLength(8)]],
      rateOfInterest: ['', [Validators.required, Validators.maxLength(6)]],
      billDate: [new Date(), [Validators.required,]],
      AmountInWords: ['',],
      totalgive: [''],
      interstpledge: [''],
      phoneno: [''],
      oldbillserialno: [''],
      image_path: [null],
      proofDetails: [''],
      proofType: ['A'],
      mailid: [''],
      newProduct: [''],
      newROI: [''],
      comments: [""],
      monthlyIncome: [""],
      isSearchCustomer: [],
      pincode: []
    });
    this.dataSource = new MatTableDataSource<customTotal>([]);
    this.pincodeSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((pincode) => this.fetchPincodeSuggestions(pincode));



  }

  onPincodeChange(event: Event): void {
    const pincode = (event.target as HTMLInputElement).value;
    this.pincodeSubject.next(pincode);
  }


  activeIndex: number = -1; // Index of the currently active suggestion



  private fetchPincodeSuggestions(pincode: string): void {
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      this.userService.getPincodeDetails(pincode).subscribe((response: any) => {
        const data = response[0];
        if (data && data.Status === 'Success') {
          this.filteredSuggestions = data.PostOffice.map((office: any) => ({
            name: office.Name,
            district: office.District,
            state: office.State,
            country: office.Country,
            fullAddress: `${office.Name}, ${office.District}, ${office.State}, ${office.Country}`,
          }));

          // Trigger change detection to update the view
          this.cdr.detectChanges();
        } else {
          this.filteredSuggestions = [];
          this.cdr.detectChanges();
        }
      }, (error) => {
        console.error('Error fetching pincode suggestions:', error);
        this.filteredSuggestions = [];
        this.cdr.detectChanges();
      });
    } else {
      this.filteredSuggestions = [];
      this.cdr.detectChanges();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey) {
      switch (event.key.toLowerCase()) {
        case 'r':
          event.preventDefault(); // Prevent browser refresh
          this.resetForm();
          break;
        case 's':
          event.preventDefault(); // Prevent any default "Save" action
          this.submitPrint(this.billform.value);
          break;
        case 'p':
          event.preventDefault(); // Prevent browser print dialog
          this.submitPrint(this.billform.value, true);
          break;
      }
    }
  }
  onSuggestionSelect(suggestion: Suggestion): void {
    const address = suggestion.fullAddress;
    this.billform.controls['fullAddress'].setValue(address);
    this.filteredSuggestions = [];
    this.cdr.detectChanges(); // Update the UI after selection
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
  trackByFn(index: number, item: any): any {
    return item.id; // or whatever unique identifier your options have
  }
  getProductDescriptions(billDetails: BillDetail[]): string {
    let descriptions = '';

    for (const billDetail of billDetails) {
      descriptions += billDetail.productDescription + ' '; // Append each description with a space
    }

    return descriptions.trim(); // Trim any extra space at the end
  }
  ngAfterViewInit(): void {

    // this.video = this.videoElement.nativeElement;

    //this.myInputElement.nativeElement.focus();



  }
  removeItemPhoto(event: Event) {
    event.stopPropagation(); // Stop event bubbling
    event.preventDefault(); // Prevent default behavior (e.g., file dialog opening)
    this.photoPreview1 = '';
    this.selectFiles1 = '';
  }

  removeCustomerPhoto(event: Event) {
    event.stopPropagation(); // Stop event bubbling
    event.preventDefault(); // Prevent default behavior (e.g., file dialog opening)
    this.photoPreview = null;
    this.selectFiles = '';
  }
  // onPincodeChange(event: Event): void {
  //   const pincode = (event.target as HTMLInputElement).value;

  //   if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
  //     const apiUrl = `https://api.postalpincode.in/pincode/${pincode}`;
  //     this.http.get(apiUrl).subscribe((response: any) => {
  //       const data = response[0];
  //       if (data.Status === 'Success') {
  //         this.filteredSuggestions = data.PostOffice.map((office: any) => ({
  //           name: office.Name,
  //           district: office.District,
  //           state: office.State,
  //           country: office.Country,
  //           fullAddress: `${office.Name}, ${office.District}, ${office.State}, ${office.Country}`,
  //         }));
  //       } else {
  //         this.filteredSuggestions = [];
  //       }
  //     });
  //   } else {
  //     this.filteredSuggestions = [];
  //   }
  // }
  // onSuggestionSelect(suggestion: Suggestion): void {
  //   this.billform.controls['fullAddress'].setValue(suggestion.fullAddress);
  //   this.filteredSuggestions = [];
  // }



  onKeyDown(event: KeyboardEvent) {
    if (this.filteredSuggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      // Move focus down
      this.activeIndex = (this.activeIndex + 1) % this.filteredSuggestions.length;
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      // Move focus up
      this.activeIndex =
        (this.activeIndex - 1 + this.filteredSuggestions.length) %
        this.filteredSuggestions.length;
      event.preventDefault();
    } else if (event.key === 'Enter' && this.activeIndex !== -1) {
      // Select the currently focused suggestion
      this.onSuggestionSelect(this.filteredSuggestions[this.activeIndex]);
      event.preventDefault();
    }
  }

  updateCustomerAddress() {
    const plotNo = this.billform.get('plotNo')?.value || '';
    const area = this.billform.get('area')?.value || '';
    const existingContent = this.billform.get('fullAddress')?.value || '';

    // Regex to remove previously appended Plot No and Area
    const cleanedContent = existingContent.replace(/Plot No:.*?, Area:.*?\./, '').trim();

    // Construct the updated address
    let newAddress = `Plot No: ${plotNo}, Area: ${area}.`;

    // Append the remaining address, if any
    if (cleanedContent) {
      newAddress += ` ${cleanedContent}`;
    }

    // Update the fullAddress form control
    this.billform.get('fullAddress')?.setValue(newAddress.trim(), { emitEvent: false });
  }


  onAddressInputChange(event: Event): void {
    const inputValue = (event.target as HTMLTextAreaElement).value;
    if (inputValue.length > 2) {
      const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
        inputValue
      )}&key=${this.apikey}&countrycode=IN&no_annotations=1`;

      this.http.get(apiUrl).subscribe((response: any) => {
        this.ngZone.run(() => {
          this.filteredSuggestions = response.results.map((result: any) => {
            const components = result.components;

            // Format each suggestion with zone, area, city, state, and country
            return `${components.suburb || components.neighbourhood || ''}, ${components.city || components.town || components.village || ''
              }, ${components.state || ''}, ${components.country || ''}`.replace(/(^[,\s]+|[,\s]+$)/g, '');
          });
        });
      });
    } else {
      this.filteredSuggestions = [];
    }
  }




  transcript = '';
  myControl = new FormControl('', [Validators.required]);
  phoneControl = new FormControl();
  itemControl = new FormControl('', [Validators.required]);
  filteredPhoneOptions!: Observable<string[]>;
  options: Customer[] = [];
  filteredOptions: Observable<string[]> | undefined;


  // Mock a file from a Blob or from base64 (for testing purposes)
  createFileFromPath(filePath: string): File {
    // Simulating the creation of a file object for demo
    const fileName = filePath.split('\\').pop() || 'Screenshot 2024-09-22 224317.png';
    const fileType = 'image/png';

    // You can replace the Blob content with your actual file content or base64 string
    const blob = new Blob([''], { type: fileType }); // Empty blob, replace with actual data
    return new File([blob], fileName, { type: fileType });
  }

  createFileList(file: File): void {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const fileList = dataTransfer.files;
    //this.selectFiles=fileList

    console.log('Mock FileList:', fileList);

    const reader = new FileReader();

    // Read the file as a Data URL (base64)
    reader.onload = () => {
      this.photoPreview = reader.result as string; // Set the photo preview as a base64 URL
      console.log('Image preview:', this.photoPreview); // Log the preview44
    };

    reader.readAsDataURL(file); // This will trigger the 'onload' callback above

    // Patch the form with the file name
    this.billform.patchValue({
      image_path: file.name
    });
    this.selectFiles = file
    console.log('this is sleceted files ', file)

    console.log(this.billform); // Log form to verifyontyp
  }
  onItemDescriptionSelected(value: string): void {
    this.billform.get('productDescription')?.setValue(value);
  }
  currentInput: string = ''

  ngOnInit() {
    this.itemControl.valueChanges.subscribe(value => {
      // Delay the update to ensure the optionSelected doesn't overwrite this value immediately
      setTimeout(() => {
        if (value !== this.lastOptionSelected) {
          // Extract everything before the last comma or newline
          const trimmedValue = value?.split(/[,;\n]/).slice(0, -1).join(',').trim() || '';

          // Update `lastOptionSelected` to exclude the portion after the last comma or newline
          this.lastOptionSelected = trimmedValue;
        }
      }, 0);
    });

    this.billform.get('isSearchCustomer')?.valueChanges.subscribe((resp) => {
      console.log(resp)
    })
    setTimeout(() => {
      console.log('JWRGKRHBHJBHBJDFBHJDHB  focus is done herrrrrrr');
      const a = this.billform.get('isSearchCustomer')?.value
      if (a) {
        setTimeout(() => {
          this.customerInput.nativeElement.focus();

        }, 0);
      }
      else {
        setTimeout(() => {
          this.phoneInput.nativeElement().focus();

        }, 0);
      }
    });
    this.userService.getSettings().subscribe(settings => {
      this.shopName = this.userService.getMySettingParamValueById('SHOP_NAME', settings);
      this.shopAddress = `${this.userService.getMySettingParamValueById('SHOP_NO', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_STREET', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_AREA', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_CITY', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_PINCODE', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_STATE', settings) || ''}`;
    });

    // this.billform.get('plotNo')?.valueChanges.subscribe(() => {
    //   this.updateCustomerAddress();
    // });

    // this.billform.get('area')?.valueChanges.subscribe(() => {
    //   this.updateCustomerAddress();
    // });

    this.filteredItemOptions = this.itemControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => this._filterItems(value ?? '')) // Call the API filtering function
    );
    this.resetForm();
    this.video = document.querySelector('#video') as HTMLVideoElement;
    if (!this.video) {
      console.error('Video element not found!');
    }
    // Get available webcam devices
    const storedValue = localStorage.getItem('isSearchCustomer');

    // Initialize isSearchCustomer based on localStorage or set to false if not present
    this.billform.patchValue({
      isSearchCustomer: storedValue !== null ? storedValue === 'true' : false
    });
    //this.fetchNextBillNumbers();
    const storedData = localStorage.getItem('responseData');
    const storedDataVoice = localStorage.getItem('responseDataVoice');
    localStorage.removeItem('responseDataVoice')
    localStorage.removeItem('responseData')

    console.log('in pledge component.ts stored voice data', storedDataVoice);

    if (storedDataVoice) {
      try {
        const parsedDataVoice = JSON.parse(storedDataVoice);  // Parse only if the data is a valid JSON string
        console.log("Parsed response data:", parsedDataVoice);  // Log the entire object
        console.log("Customer Name:", parsedDataVoice?.customer_name);
        this.onCustomerSelectedAI(parsedDataVoice?.customer_name)  // Log customer_name specifically
        this.patchVoiceValues(parsedDataVoice)
        localStorage.removeItem('responseDataVoice')
        // window.location.reload()
      } catch (error) {
        console.error("Error parsing response data:", error);
      }
    } else {
      console.log('No response data found in local storage.');
    }

    if (storedData) {
      const parsedData = JSON.parse(storedData);
      console.log("Parsed response data:", parsedData);  // Log the entire object
      console.log("Customer Name:", parsedData?.customer_name);  // Log customer_name specifically

      this.patcheValues(parsedData);
      localStorage.removeItem('responseData')

    } else {
      console.log('No response data found in local storage.');
    }

    this.filteredPhoneOptions = this.phoneControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => this._filterByPhone(value ?? '')) // Call the API filtering function
    );
    //this.getCustomerByphone()
    this.fetchProductTypes();
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => this._filter(value || '')), // switchMap will flatten the Observable<Observable<string[]>> to Observable<string[]>
    );

    this.billform.get('rateOfInterest')!.valueChanges.subscribe(() => this.calculateIntrestPledgeAndTotalGive());
    this.billform.get('amount')!.valueChanges.subscribe(() => this.calculateIntrestPledgeAndTotalGive());
    this.billform.get('amount')!.valueChanges.subscribe(() => this.roiacess());
    this.billform.get('productTypeNo')!.valueChanges.subscribe(() => this.roiacess());
    this.billform.get('amount')!.valueChanges.subscribe(() => this.presentvalue());
    this.billform.get('productTypeNo')!.valueChanges.subscribe(() => this.presentvalue());


    this.userService.getSettings().subscribe(
      list => {
        this.setting = list;
        // console.log("seeting silver "+this.userService.getMySettingParamValueById("CURRENT_SERIAL",this.setting));
        this.silverROI = this.userService.getMySettingParamValueById("SILVER_INTREST", this.setting);

        //this.silverROI=this.setting.getParamValueById("CURRENT_SERIAL",this.setting);
        this.goldROI5K = this.userService.getMySettingParamValueById("GOLD_INTREST_LESS_THAN_5000", this.setting);
        this.goldROI10K = this.userService.getMySettingParamValueById("GOLD_INTREST_LESS_THAN_10000", this.setting);
        this.goldROI20K = this.userService.getMySettingParamValueById("GOLD_INTREST_LESS_THAN_20000", this.setting);
        this.goldROI50K = this.userService.getMySettingParamValueById("GOLD_INTREST_LESS_THAN_50000", this.setting);
        this.goldROI100K = this.userService.getMySettingParamValueById("GOLD_INTREST_LESS_THAN_100000", this.setting);
        this.goldROI100Kplus = this.userService.getMySettingParamValueById("GOLD_INTREST_MORE_THAN_100000", this.setting);
        this.billform.patchValue({
          billSerial: this.userService.getMySettingParamValueById("CURRENT_SERIAL", this.setting),
          monthlyIncome: this.userService.getMySettingParamValueById("MONTHLY_INCOME", this.setting)
        })

      });

    // Check for AI prefill data from AI assistant
    const pledgeState = history.state;
    const aiPledge = pledgeState?.aiPrefillPledge || pledgeState?.prefillPledge || pledgeState?.prefillData?.prefillPledge || pledgeState?.prefillData;
    if (aiPledge) {
      setTimeout(() => {
        if (aiPledge.customerName) {
          this.myControl.patchValue(aiPledge.customerName);
          this.onCustomerSelectedAI(aiPledge.customerName);
        }
        if (aiPledge.phone) {
          this.phoneControl.patchValue(aiPledge.phone);
          this.billform.patchValue({ phoneno: String(aiPledge.phone) });
        }
        if (aiPledge.address) {
          this.billform.patchValue({ fullAddress: aiPledge.address });
        }
        if (aiPledge.customerId) {
          this.billform.patchValue({ customerid: aiPledge.customerId });
        }
        const articleText = aiPledge.article || aiPledge.item_description || '';
        if (articleText) {
          this.itemControl.patchValue(articleText);
          this.billform.patchValue({ productDescription: articleText });
        }
        if (aiPledge.grams || aiPledge.weight) {
          this.billform.patchValue({ grams: String(aiPledge.grams || aiPledge.weight) });
        }
        if (aiPledge.amount) {
          this.billform.patchValue({ amount: String(aiPledge.amount) });
        }
        if (aiPledge.rateOfInterest || aiPledge.roi) {
          this.billform.patchValue({ rateOfInterest: String(aiPledge.rateOfInterest || aiPledge.roi) });
        }
        if (aiPledge.productQuantity || aiPledge.quantity) {
          this.billform.patchValue({ productQuantity: String(aiPledge.productQuantity || aiPledge.quantity || 1) });
        }
        if (aiPledge.comments) {
          this.billform.patchValue({ comments: aiPledge.comments });
        }
        this.calculateIntrestPledgeAndTotalGive();
        this.cdr.detectChanges();
        this.snackBar.open('AI pre-filled pledge details. Review and click Print/Save.', 'OK', { duration: 4000 });
      }, 400);
    }

  }

  fetchProductTypes() {
    this.userService.getProductTypes().subscribe((resp: any) => {
      console.log('here is product details............', resp)
      this.productOptions = resp;
      this.productTypes = resp;
      this.products = resp.map((item: { productTypeCode: any; }) => item.productTypeCode);
      this.billform.patchValue({
        productTypeNo: this.getProductTypeNo("GOLD")
      })
      // goldProducts will now contain only the items with productTypeCode 'GOLD'
    })

  }
  apikey = "d06e213aa79d4aaabafa7ca40e9e3051"
  onInputChange(event: Event): void {
    const inputValue = (event.target as HTMLTextAreaElement).value;
    const lat = 13.0827;  // Latitude of Chennai
    const lon = 80.2707;  // Longitude of Chennai
    const radius = 20000;  // Radius in meters (5 km)
    if (inputValue.length > 2) {
      const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
        inputValue
      )}&key=${this.apikey}&countrycode=IN&no_annotations=1&boundingBox=${lat - 0.045},${lon - 0.045},${lat + 0.045},${lon + 0.045}`;

      this.http.get(apiUrl).subscribe((response: any) => {
        this.ngZone.run(() => {
          this.filteredSuggestions = response.results.map((result: any) => result.formatted);
        });
      });
    } else {
      this.filteredSuggestions = [];
    }
  }


  selectSuggestion(suggestion: string): void {
    this.billform.controls['fullAddress'].setValue(suggestion);
    this.filteredSuggestions = [];
  }
  focusingInitializer(searchCustomer: boolean) {
    if (searchCustomer) {
      setTimeout(() => {
        this.customerInput.nativeElement.focus();


      }, 0);
    }
    else {
      setTimeout(() => {
        this.phoneInput.nativeElement.focus();

      }, 0);
    }

  }
  getVideoDevices() {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      this.videoDevices = videoDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Device ${videoDevices.indexOf(device) + 1}`
      }));

      if (this.videoDevices.length > 0) {
        this.videoDeviceId = this.videoDevices[0].deviceId; // Default to the first device
        console.log('Available video devices:', this.videoDevices);
      } else {
        console.error('No video devices found.');
      }
    }).catch((err) => {
      console.error('Error enumerating devices:', err);
    });
  }
  // openCamera(input:string) {
  //   const container = document.createElement('div');
  //   container.style.position = 'fixed';
  //   container.style.top = '0';
  //   container.style.left = '0';
  //   container.style.width = '100%';
  //   container.style.height = '100%';
  //   container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  //   container.style.display = 'flex';
  //   container.style.flexDirection = 'column';
  //   container.style.justifyContent = 'center';
  //   container.style.alignItems = 'center';
  //   container.style.zIndex = '9999';
  //   document.body.appendChild(container);

  //   const video = document.createElement('video');
  //   video.style.borderRadius = '20px';
  //   video.style.border = '2px solid #333';
  //   video.style.width = '50%';
  //   container.appendChild(video);

  //   const deviceSelector = document.createElement('select');
  //   deviceSelector.style.marginTop = '10px';
  //   deviceSelector.style.padding = '10px';
  //   deviceSelector.style.borderRadius = '5px';
  //   container.appendChild(deviceSelector);

  //   const captureButton = document.createElement('button');
  //   captureButton.innerHTML = 'Capture Photo';
  //   captureButton.style.marginTop = '10px';
  //   captureButton.style.padding = '10px 20px';
  //   captureButton.style.backgroundColor = '#333';
  //   captureButton.style.color = '#fff';
  //   captureButton.style.border = 'none';
  //   captureButton.style.borderRadius = '5px';
  //   captureButton.style.cursor = 'pointer';
  //   container.appendChild(captureButton);

  //   const canvas = document.createElement('canvas');

  //   let currentStream: MediaStream | null = null;

  //   const stopCurrentStream = () => {
  //     if (currentStream) {
  //       currentStream.getTracks().forEach((track) => track.stop());
  //       currentStream = null;
  //     }
  //   };

  //   const startCamera = (deviceId: string) => {
  //     stopCurrentStream();

  //     navigator.mediaDevices
  //       .getUserMedia({ video: { deviceId } })
  //       .then((stream) => {
  //         currentStream = stream;
  //         video.srcObject = stream;
  //         video.play();
  //       })
  //       .catch((error) => {
  //         console.error('Error accessing camera:', error);
  //         alert('Could not access the selected camera.');
  //       });
  //   };

  //   navigator.mediaDevices.enumerateDevices().then((devices) => {
  //     const videoDevices = devices.filter((device) => device.kind === 'videoinput');

  //     if (videoDevices.length === 0) {
  //       alert('No cameras found on this device.');
  //       container.remove();
  //       return;
  //     }

  //     videoDevices.forEach((device, index) => {
  //       const option = document.createElement('option');
  //       option.value = device.deviceId;
  //       option.text = device.label || `Camera ${index + 1}`;
  //       deviceSelector.appendChild(option);
  //     });

  //     startCamera(videoDevices[0].deviceId); // Start with the first camera

  //     deviceSelector.addEventListener('change', () => {
  //       const selectedDeviceId = deviceSelector.value;
  //       startCamera(selectedDeviceId);
  //     });
  //   });

  //   captureButton.addEventListener('click', () => {
  //     const context = canvas.getContext('2d');
  //     if (!context) {
  //       console.error('Failed to get canvas context.');
  //       return;
  //     }

  //     canvas.width = video.videoWidth;
  //     canvas.height = video.videoHeight;
  //     context.drawImage(video, 0, 0, canvas.width, canvas.height);

  //     canvas.toBlob((blob) => {
  //       if (blob) {
  //         const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  //         if(input=='c'){

  //           this.selectFiles=file
  //           const reader = new FileReader();
  //           reader.onload = () => {
  //             this.photoPreview = reader.result as string; // Ensure the type is string
  //             console.log('Photo preview URL:', this.photoPreview); // Debug log

  //             // Set the file name in the form control
  //             this.billform.patchValue({
  //               image_path: file.name,
  //             });

  //             console.log('Selected file:', this.selectFiles);

  //             // Trigger change detection manually
  //             this.cdr.detectChanges(); // Force change detection
  //           };

  //           reader.readAsDataURL(file); // Read the file as a data URL


  //         }
  //         if(input=='i'){
  //           this.selectFiles1=file
  //           const reader = new FileReader();
  //           reader.onload = () => {
  //             this.photoPreview1 = reader.result as string; // Ensure the type is string
  //             console.log('Photo preview URL:', this.photoPreview1); // Debug log

  //             // Set the file name in the form control
  //             this.billform.patchValue({
  //               image_path: file.name,
  //             });

  //             console.log('Selected file:', this.selectFiles1);

  //             // Trigger change detection manually
  //             this.cdr.detectChanges(); // Force change detection
  //           };

  //           reader.readAsDataURL(file);

  //         }
  //       }
  //     }, 'image/jpeg');

  //     stopCurrentStream();
  //     container.remove();
  //   });
  // }



  // stopCamera() {
  //   if (this.stream) {
  //     const tracks = this.stream.getTracks();
  //     tracks.forEach(track => track.stop());
  //     this.isCameraActive = false;
  //     console.log('Camera stopped');
  //   }
  // }

  // takePhoto() {
  //   if (this.video) {
  //     const canvas = document.createElement('canvas');
  //     const context = canvas.getContext('2d');

  //     if (context) {
  //       canvas.width = this.video.videoWidth;
  //       canvas.height = this.video.videoHeight;
  //       context.drawImage(this.video, 0, 0, canvas.width, canvas.height);

  //       const imageDataUrl = canvas.toDataURL('image/png');
  //       this.photoPreview3 = imageDataUrl;
  //       console.log('Captured photo:', imageDataUrl);
  //     }
  //   }
  // }


  openCamera(input: string) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '90%';
    // container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    // Close Button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24px" height="24px">
        <path d="M19.071 4.929l-1.414-1.414L12 9.172 6.343 3.515 4.929 4.929 10.586 12l-5.657 5.657 1.414 1.414L12 14.828l5.657 5.657 1.414-1.414L13.414 12z"/>
      </svg>`;
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '5px';
    closeButton.style.zIndex = '10000'; // Ensure it's above all other elements
    container.appendChild(closeButton);

    const video = document.createElement('video');
    video.style.borderRadius = '20px';
    video.style.border = '2px solid #333';
    video.style.width = '50%';
    container.appendChild(video);

    const deviceSelector = document.createElement('select');
    deviceSelector.style.marginTop = '10px';
    deviceSelector.style.padding = '10px';
    deviceSelector.style.borderRadius = '5px';
    container.appendChild(deviceSelector);

    const captureButton = document.createElement('button');
    captureButton.innerHTML = 'Capture Photo';
    captureButton.style.marginTop = '10px';
    captureButton.style.padding = '10px 20px';
    captureButton.style.backgroundColor = '#333';
    captureButton.style.color = '#fff';
    captureButton.style.border = 'none';
    captureButton.style.borderRadius = '5px';
    captureButton.style.cursor = 'pointer';
    container.appendChild(captureButton);

    const canvas = document.createElement('canvas');

    let currentStream: MediaStream | null = null;

    const stopCurrentStream = () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
        currentStream = null;
      }
    };

    const startCamera = (deviceId: string) => {
      stopCurrentStream();

      navigator.mediaDevices
        .getUserMedia({ video: { deviceId } })
        .then((stream) => {
          currentStream = stream;
          video.srcObject = stream;
          video.play();
        })
        .catch((error) => {
          console.error('Error accessing camera:', error);
          alert('Could not access the selected camera.');
        });
    };

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');

      if (videoDevices.length === 0) {
        alert('No cameras found on this device.');
        container.remove();
        return;
      }

      videoDevices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Camera ${index + 1}`;
        deviceSelector.appendChild(option);
      });

      startCamera(videoDevices[0].deviceId); // Start with the first camera

      deviceSelector.addEventListener('change', () => {
        const selectedDeviceId = deviceSelector.value;
        startCamera(selectedDeviceId);
      });
    });

    captureButton.addEventListener('click', () => {
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Failed to get canvas context.');
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            if (input == 'c') {
              this.selectFiles = file;
              const reader = new FileReader();
              reader.onload = () => {
                this.photoPreview = reader.result as string;
                this.billform.patchValue({
                  image_path: file.name,
                });
                this.cdr.detectChanges();
              };
              reader.readAsDataURL(file);
            }
            if (input == 'i') {
              this.selectFiles1 = file;
              const reader = new FileReader();
              reader.onload = () => {
                this.photoPreview1 = reader.result as string;
                this.billform.patchValue({
                  image_path: file.name,
                });
                this.cdr.detectChanges();
              };
              reader.readAsDataURL(file);
            }
          }
        },
        'image/jpeg'
      );

      stopCurrentStream();
      container.remove();
      document.removeEventListener('keydown', handleEscapeKey); // Remove the Escape key listener
    });

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        stopCurrentStream();
        container.remove();
        document.removeEventListener('keydown', handleEscapeKey); // Remove the Escape key listener
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    // Close the overlay when the close button is clicked
    closeButton.addEventListener('click', () => {
      stopCurrentStream();
      container.remove();
      document.removeEventListener('keydown', handleEscapeKey); // Remove the Escape key listener
    });
  }


  filteredItemOptions!: Observable<string[]>;

  private _filterItems(item: string): Observable<string[]> {
    // Trim the string and extract the portion after the last delimiter
    const trimmedString = item.split(/[,;/\n]/).pop()?.toLowerCase().trim() || '';

    if (trimmedString === '') {
      return of([]);
    }

    return this.userService.getItembyprefix(trimmedString).pipe(
      map((resp: any[]) => {
        if (!resp || resp.length === 0) {
          return [trimmedString];
        }

        const filteredOptions = resp.filter(option =>
          option.toLowerCase().includes(trimmedString)
        );

        return filteredOptions.length > 0 ? filteredOptions : [trimmedString];
      })
    );
  }
  lastOptionSelected: string = '';

  onItemSelected(selectedOption: string): void {
    console.log('check oit broooo', this.itemControl.value);

    // Normalize the current `lastOptionSelected` at the start
    if (this.lastOptionSelected) {
      this.lastOptionSelected = this.lastOptionSelected
        .replace(/,+/g, ',')         // Replace multiple commas with a single comma
        .replace(/\n+/g, '\n')       // Replace multiple newlines with a single newline
        .replace(/,\s*\n?/g, ',\n'); // Ensure every comma is followed by exactly one newline
    } else {
      this.lastOptionSelected = ''; // Initialize if undefined
    }

    // Normalize the selected option by removing newlines
    selectedOption = selectedOption.trim().replace(/\n+/g, '');

    // Append the new option with a consistent format
    if (this.lastOptionSelected) {
      this.lastOptionSelected += ',\n' + selectedOption;
    } else {
      this.lastOptionSelected = selectedOption; // Set the first option directly
    }

    // Final cleanup to ensure consistent formatting
    this.lastOptionSelected = this.lastOptionSelected
      .replace(/,+/g, ',')         // Replace multiple commas with a single comma
      .replace(/\n+/g, '\n')       // Replace multiple newlines with a single newline
      .replace(/,\s*\n/g, ',\n');  // Ensure every comma is followed by exactly one newline

    // Update the form control with the cleaned-up value
    this.itemControl.setValue(this.lastOptionSelected);

    // Log to verify the changes
    console.log('Updated Value:', this.lastOptionSelected);
  }
  onTyping(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const typedValue = inputElement ? inputElement.value : '';  // Get the current typed value

    // Get the last typed character (the last character of the input)
    const lastTypedChar = typedValue.charAt(typedValue.length - 1);

    // Log each character typed
    console.log('Last Typed Character:', lastTypedChar);
    this.currentInput += lastTypedChar
  }

  private _filter(value: string): Observable<string[]> {
    // Check if phoneControl has a value; if so, do not filter by name
    if (!this.billform.get('isSearchCustomer')?.value) {
      return of([]); // Return an empty array if phoneControl is filled
    }

    const input = value.toLowerCase().trim(); // Normalize input
    console.log('Input for filtering:', value);

    // If input is empty, return an empty array
    if (input === '') {
      return of([]); // Return an empty array if the input is empty
    }

    // Fetch filtered customer records from the API
    return this.userService.getCustomersByName(input).pipe(
      map((resp: Customer[]) => {
        console.log('API response:', resp);
        this.options = resp; // Store the response for further use

        // Initialize an array for filtered options
        let filteredOptions: string[] = [];

        // Extract customer names and filter based on the input
        if (resp && resp.length > 0) {
          const customerNames = resp.map(customer => customer.customerName?.toLowerCase() || '');

          // Filter customer names based on the input and convert to uppercase
          filteredOptions = customerNames.filter(option => option.includes(input))
            .map(option => option.toUpperCase()); // Convert to uppercase
        }

        // Add the input as the first option, in uppercase, if it's not already included
        if (input && !filteredOptions.includes(input.toUpperCase())) {
          filteredOptions.unshift(input.toUpperCase()); // Add the input in uppercase at the start
        }

        // If no matches are found, include the user's input in uppercase
        if (filteredOptions.length === 0) {
          filteredOptions.push(value.toUpperCase()); // Convert input to uppercase
        }

        // Return the filtered options
        return filteredOptions;
      })
    );
  }
  toggleCustomerSearch() {
    const currentValue = this.billform.get('isSearchCustomer')?.value;

    // Toggle the value
    this.billform.patchValue({
      isSearchCustomer: !currentValue
    });

    // Store the new value in local storage
    try {
      localStorage.setItem('isSearchCustomer', (!currentValue).toString());
    }
    catch (error) {
      this.userService.handleStorageError(error);
    }
  }

  onCustomerSelectedAI(customerName: string) {
    this.photoPreview = ''
    this.selectFiles = ''
    this.fetchCustomerData(customerName)
    this.userService.getCustomersByName(customerName).subscribe((resp: any) => {
      console.log("Name Response is here.................", resp)
      const customer = resp[0]
      this.phoneControl.patchValue(customer.phoneno)
      if (customer.customerName) {


        this.billform.patchValue({
          fullAddress: customer.address,
          customerid: customer.customerid,
          proofType: customer.proofType,
          proofDetails: customer.proofDetails,
          mailid: customer.mailid,
          productQuantity: '1'
        })
        this.retrievePhoto(customer.customerid)
        if (this.photoPreview === '') {
          const a = this.getImageUrl(customer.photo)
          if (a) {
            this.photoPreview = a
            this.cdr.detectChanges()
          }
          else {
            this.photoPreview = null
          }
        }
      }
      else {
        if (this.userService.isMobileScreen()) {
          this.isNewCustomer = false

        }
        else {
          this.isNewCustomer = true
          setTimeout(() => {
            this.pincodeInput.nativeElement.focus();
          }, 0);
        }
      }
      this.updateAmountInWordsNan()
      this.roiacess()
      this.presentvalue()


    })


  }
  onTabOutPhone(event: FocusEvent) {
    setTimeout(() => {
      this.amountInput.nativeElement.focus();


    }, 0);
  }
  getBillDetails() {

    const billDetail: BillDetail = {
      productNo: (this.billform.get('productNo')?.value),
      productDescription: this.itemControl.value!,
      productQuantity: (this.billform.get('productQuantity')?.value),
      articlephoto: undefined
    };
    const billDetails: any[] = [];
    billDetails.push(billDetail);

    return billDetails;
  }
  async storePhoto(customerId: string, selectedFile: Blob): Promise<void> {
    console.log('Attempting to store photo...');

    // Validate inputs
    if (customerId && selectedFile) {
      console.log('Storing photo with details:', { customerId, selectedFile });

      try {
        // Attempt to add the photo to IndexedDB
        await this.indexedDbService.addPhoto(customerId, selectedFile);
        //alert('Photo stored successfully!');
      } catch (error) {
        console.error('Error storing photo:', error);
        //alert('Failed to store the photo. Please try again.');
      }
    } else {
      // alert('Please provide a valid customer ID and select a photo.');
    }
  }

  async retrievePhoto(customerId: string): Promise<void> {
    if (customerId) {
      console.log('Retrieving photo for customer ID:', customerId);

      try {
        // Attempt to get the photo from IndexedDB
        const photoData = await this.indexedDbService.getPhoto(customerId);
        console.log('Retrieved photo data:', photoData);

        if (photoData && photoData.photo) {
          // Assuming 'photo' is the field that contains the Blob or file-like data
          this.selectFiles = new Blob([photoData.photo], { type: photoData.photo.type });
          console.log('Photo stored in selectFiles:', this.selectFiles);

          // If you still want to display the photo, use displayPhoto
          this.displayPhoto(photoData.photo);
        }
        // } else {
        //   this.photoPreview=''

        //   console.log('No photo found for the given customer ID. You may need to upload a new photo.');
        //   // Optionally, prompt the user to upload a new photo here
        // }
      } catch (error) {
        console.error('Error retrieving photo:', error);
        //alert('Failed to retrieve the photo. Please try again.');
      }
    } else {
      //alert('Please provide a valid customer ID.');
    }
  }

  // Update or add a new photo
  async updatePhoto(customerId: string, file: Blob): Promise<void> {
    await this.indexedDbService.addOrUpdatePhoto(customerId, file);
    console.log('Photo updated successfully');
  }

  // Display the photo in the UI
  displayPhoto(photoBlob: Blob): void {
    const url = URL.createObjectURL(photoBlob); // Create a URL for the Blob
    this.photoPreview = url; // Set the URL to the photoPreview variable
  }
  patchVoiceValues(data: any) {
    console.log('seee this...........................................................................')


    this.myControl.patchValue(data.customer_name)
    const article = this.mapArticleToCode(data.article)

    this.billform.patchValue({
      grams: data.weight,
      productDescription: data.item_description,
      article: data.article,
      amount: data.amount
    })
    this.itemControl.patchValue(data.item_description)
    this.roiacess()
    this.presentvalue()
    localStorage.removeItem('responseDataVoice')
  }
  mapArticleToCode(article: string): string {
    // Convert the article to lowercase to make the function case-insensitive
    const lowerCaseArticle = article.toLowerCase();

    // Use a switch statement or conditional checks to return the correct code
    switch (lowerCaseArticle) {
      case 'gold':
        return 'G';
      case 'silver':
        return 'S';
      default:
        return 'O';  // Default to 'O' for any other article types
    }
  }







  patcheValues(data: any) {
    const name = data?.customer_name?.trim();

    // Regular expression to replace "s/o" or "d/o" with " ."
    const formattedName = name
      ?.replace(/\b(s|d)\/o\b/gi, ' .')  // Replace "s/o" or "d/o" with " ."
      .replace(/\s+/g, ' ')              // Replace multiple spaces with a single space
      .replace(/ \./g, '.')               // Remove space before the dot
      .replace(/\s+\./g, '.')              // Remove space before the dot
      .trim();                            // Trim any leading or trailing whitespace

    console.log('Formatted name is this with dot in between:', formattedName);

    // Patch the form with the transformed customer name
    this.billform.patchValue({
      amount: data?.amount,
      productDescription: data?.item_description,
      grams: data?.weight,
      // Patching the formatted name
    });
    this.itemControl.patchValue(data?.item_description)
    this.myControl.patchValue(formattedName)

    // Other function calls and logic
    this.updateAmountInWordsNan();
    console.log('Patched customer name:', this.billform.get('customerName')?.value);

    // Clear local storage
    localStorage.removeItem('responseData');

    // Trigger change detection
    this.cdr.detectChanges();
  }

  private _filterByPhone(phone: string): Observable<string[]> {
    // Check if the 'customerName' field has a value; if it does, we don't filter by phone
    if (this.billform.get('isSearchCustomer')?.value) {
      return of([]); // Return an empty array if customerName is present
    }

    const input = phone.toLowerCase().trim(); // Normalize input
    console.log('Phone number entered:', phone);

    // If input is empty, return an empty array
    if (input === '') {
      return of([]);
    }

    // Fetch filtered customer records by phone from the API
    return this.userService.getCustomerByPhone(input).pipe(
      map((resp: any[]) => {
        this.selectedCustomerarr = resp; // Store the response for further use
        console.log('Filtered customers:', this.selectedCustomerarr);

        // If no response or no customers, return empty array
        if (!resp || resp.length === 0) {
          return [phone]; // Return user's input as an option if no matches found
        }

        // Extract phone numbers and customer names, then format them as "phonenumber : customername"
        const formattedOptions = resp.map(customer => {
          const phoneNumber = (customer.phoneno || '').toString(); // Convert phone number to string
          const customerName = customer.customerName || ''; // Get customer name or an empty string

          // Return formatted string "phonenumber : customername"
          return `${phoneNumber} : ${customerName}`;
        });

        // Filter options based on whether they include the input
        const filteredOptions = formattedOptions.filter(option => option.toLowerCase().includes(input));

        // If no formatted options are found, push the user's input as an option
        return filteredOptions.length > 0 ? filteredOptions : [phone];
      })
    );
  }
  private _extractPhoneNumber(formattedString: string): string {
    // Regular expression to match phone numbers (digits before the colon)
    const match = formattedString.match(/^(\d+)\s*:/);

    // If a match is found, return the phone number part
    return match ? match[1] : '';
  }
  // private searchByPhoneNumber(phone: number): Customer | undefined {
  //   if (!this.selectedCustomerarr || this.selectedCustomerarr.length === 0) {
  //     console.log('Customer array is empty or undefined.');
  //     return undefined; // Explicitly return undefined if the array is empty or undefined
  //   }

  //   // Search for the customer with the matching phone number or alternate phone number
  //   const foundCustomer = this.selectedCustomerarr.find(customer => {
  //     // Ensure that the phone number comparison is done as a number, checking both primary and alternate phones
  //     return customer.phoneno === phone || customer.alternatePhone === phone;
  //   });

  //   if (foundCustomer) {
  //     console.log(`Found customer: ${foundCustomer.customerName}, Phone: ${foundCustomer.phoneno}`);
  //     return foundCustomer;  // Return the found customer
  //   } else {
  //     console.log('No customer found with the provided phone number.');
  //     return undefined;  // Explicitly return undefined when no customer is found
  //   }
  // }
  private searchByPhoneNumber(phone: number): Customer | undefined {
    if (!this.selectedCustomerarr || this.selectedCustomerarr.length === 0) {
      console.log('Customer array is empty or undefined.');
      return undefined; // Explicitly return undefined if the array is empty or undefined
    }

    // Search for the customer with the matching phone number
    const foundCustomer = this.selectedCustomerarr.find(customer => {
      return customer.phoneno === phone;  // Ensure that the phone number comparison is done as a number
    });

    if (foundCustomer) {
      return foundCustomer;  // Return the found customer
    } else {
      console.log('No customer found with the provided phone number.');
      return undefined;  // Explicitly return undefined when no customer is found
    }
  }

  private searchByPhoneNumberAndName(input: string): Customer | undefined {
    // Check if the customer array is empty or undefined
    if (!this.selectedCustomerarr || this.selectedCustomerarr.length === 0) {
      console.log('Customer array is empty or undefined.');
      return undefined; // Explicitly return undefined if no data exists
    }

    // Parse input to extract phone number and customer name
    const [phonePart, namePart] = input.split(':').map(part => part.trim());

    // Validate the phone number
    const phone = Number(phonePart);
    if (isNaN(phone)) {
      console.log('Invalid phone number format.');
      return undefined;
    }

    // Search for the customer where both phone number and name match
    const foundCustomer = this.selectedCustomerarr.find(customer => {
      return customer.phoneno === phone && customer.customerName === namePart;
    });

    // Return the found customer object or undefined
    if (foundCustomer) {
      return foundCustomer; // Return the matching customer object
    } else {
      console.log('No customer found with the provided phone number and name.');
      return undefined;
    }
  }


  addToLocalStorageArray(newItem: any) {
    const storedArray: any[] = JSON.parse(localStorage.getItem('billDataArray') || '[]');

    storedArray.push(newItem);
    try {


      localStorage.setItem('billDataArray', JSON.stringify(storedArray));
    } catch (error) {
      this.userService.handleStorageError(error);
    }
    console.log('Updated Array:', storedArray); // Debugging
  }
  getCustomer() {
    console.log('in get customer thisi is phoneno  jiiii', this.billform.get('phoneno')?.value)
    console.log('in get customer jiiii pass this jiii ', this.billform.get('phoneControl')?.value)
    let address: string
    if (this.isNewCustomer) {
      address =
        (this.billform.get('plotNo')?.value ?? '') + ' ' +
        (this.billform.get('area')?.value ?? '') + ' ' +
        (this.billform.get('fullAddress')?.value ?? '') + ' ' +
        (this.billform.get('pincode')?.value ?? '');
      console.log(address)

    }
    else {
      address = this.billform.get('fullAddress')?.value

    }
    const customer: Customer = {
      "customerid": parseInt(this.billform.get('customerid')?.value),
      "area": this.billform.get('area')?.value,
      "mailid": this.billform.get('mailid')?.value,
      "state": this.billform.get('state')?.value,
      "pincode": this.billform.get('pincode')?.value,
      "customerName": this.myControl.value,
      "street": this.billform.get('street')?.value,
      "district": this.billform.get('district')?.value,
      "country": this.billform.get('country')?.value,
      "relationship": null,
      "relationshipname": null,
      "phoneno": this.phoneControl.value,
      "mobileno": this.billform.get('mobileno')?.value,
      "address": address, // we are getting from full address and sending to payload
      "proofType": this.billform.get('proofType')?.value,
      "proofDetails": this.billform.get('proofDetails')?.value,
      imagePath: this.billform.get('image_path')?.value,
      "fullAddress": address,
      photo: undefined,
    }
    return customer;
  }
  // onPhoneSelected(phoneNumber: string) {
  //   this.photoPreview1 = '';

  //   console.log('Phone number selected:', this.selectedCustomerarr);

  //   // Extract and convert the phone number to string and number
  //   const phoneNumberAsString = this._extractPhoneNumber(phoneNumber).toString();
  //   const phoneNumberAsNumber = Number(phoneNumberAsString); // Convert string to number

  //   // Search for customer by phone number
  //   const customer = this.searchByPhoneNumber(phoneNumberAsNumber);
  //   console.log(customer);

  //   if (customer) {
  //     this.fetchCustomerData(customer.customerName);
  //   } else {
  //     // Handle the case where `customer` is undefined
  //     console.log('Customer is undefined');
  //   }

  //   if (this.selectedCustomerarr) {
  //     // If a customer is selected, update the form with customer data
  //     this.billform.patchValue({
  //       mailid: customer?.mailid,
  //       fullAddress: customer?.address,
  //       proofType: customer?.proofType,
  //       proofDetails: customer?.proofDetails,
  //       customerid: customer?.customerid
  //     });
  //   } else {
  //     // Handle the case where no customer is selected (new customer)
  //     this.isNewCustomer = true;
  //     this.billform.patchValue({
  //       fullAddress: '',
  //       mailid: '',
  //       proofDetails: '',
  //       proofType: 'A',
  //       customerid: ''
  //     });
  //     this.phoneControl.patchValue('');
  //     this.photoPreview = null;
  //   }

  //   // Update form values for customer name and phone number
  //   this.myControl.patchValue(customer?.customerName);
  //   this.phoneControl.patchValue(phoneNumberAsString);

  //   // Retrieve the photo if available
  //   this.retrievePhoto(String(customer?.customerid));
  //   if (this.photoPreview == null) {
  //     const imageUrl = this.getImageUrl(customer?.photo);
  //     this.photoPreview = imageUrl;
  //     this.cdr.detectChanges();
  //   }
  // }
  onPhoneSelected(phoneNumber: string) {
    this.photoPreview1 = ''

    console.log('Phone number selected:', phoneNumber, this.selectedCustomerarr);
    const phoneNumberAsString = this._extractPhoneNumber(phoneNumber).toString();
    const phoneNumberAsNumber = Number(phoneNumberAsString); // Convert string to number
    const customer = this.searchByPhoneNumberAndName(phoneNumber)
    console.log(customer)
    if (customer) {
      setTimeout(() => {
        this.amountInput.nativeElement.focus();
      }, 0);
      this.isNewCustomer = false

      //this.fetchCustomerData(customer.customerName)
      console.log('seee hereeeeee', customer, customer.customerName)


    } else {
      console.log(phoneNumber, 'yhi hain bhaiiiiiiiiiiiiiiiii')
      console.log('seee hereeeeee', customer)
      this.isNewCustomer = true
      setTimeout(() => {
        this.customerInput.nativeElement.focus();
      }, 0);
      this.billform.patchValue({
        fullAddress: '',
        mailid: '',
        proofDetails: '',
        proofType: 'A',
        customerid: ''
      })
      this.photoPreview = null
      this.selectFiles = ''
      this.myControl.patchValue('')
      this.phoneControl.patchValue(phoneNumber)
      // Handle the case where customer is undefined
      console.log('Customer is undefined');
      return
    }
    if (this.selectedCustomerarr) {
      this.billform.patchValue({
        mailid: customer?.mailid,
        fullAddress: customer?.address,
        proofType: customer?.proofType,
        proofDetails: customer?.proofDetails,

        customerid: customer?.customerid
      })
      this.fetchCustomerData(customer?.customerName)


    } else {
      if (this.userService.isMobileScreen()) {
        this.isNewCustomer = false

      }
      else {
        this.isNewCustomer = true
        setTimeout(() => {
          this.pincodeInput.nativeElement.focus();
        }, 0);
      }
      this.billform.patchValue({
        fullAddress: '',
        mailid: '',
        proofDetails: '',
        proofType: 'A',
        customerid: ''
      })
      this.phoneControl.patchValue('')
      this.photoPreview = null

    }


    this.myControl.patchValue(customer?.customerName)
    this.phoneControl.patchValue(phoneNumberAsString)
    //phoneno:phoneNumberAsString,

    this.retrievePhoto(String(customer?.customerid))
    if (this.photoPreview == null) {
      const a = this.getImageUrl(customer?.photo)

      this.photoPreview = a
      this.cdr.detectChanges
    }




  }
  // trackByFn(index: number, item: any) {
  //   return index;
  // }  

  fetchNextBillNumbers() {
    // Fetch the next bill number from the backend
    this.userService.getNextBillNumber().subscribe(
      response => {
        console.log('next bill no', response)
        this.nextBillNo = response.nextBillNo;
        this.billform.patchValue({
          billNo: this.nextBillNo,
        });
      },
      error => {
        console.error('Error fetching next bill numbers:', error);
      }
    );
  }

  patchFormValues(data: any) {
    // Ensure 'data' and 'data.data' are defined
    if (data && data.data) {
      this.data = data.data; // Store the data
      console.log('Data received in patch values:', data);
      console.log('Name received:', data.data.customer_name, data.data.article);

      // Patch the form values
      this.billform.patchValue({
        // customerName: data.data.customer_name || '', // Default to empty string if null/undefined
        amount: data.data.amount || 0, // Default to 0 if amount is null/undefined
        grams: data.data.weight || '', // Default to empty string if null/undefined
        productDescription: data.data.item_description !== 'null' ? data.data.item_description : '', // Handle 'null' string
        productTypeNo: data.data.article || '', // Default to empty string if null/undefined
      });
      this.itemControl.patchValue(data.data.item_description !== 'null' ? data.data.item_description : '')
      this.myControl.patchValue(data.data.customer_name || '')

      // Detect changes to ensure Angular recognizes the updated form values
      this.cdr.detectChanges();
      this.cdr.markForCheck();

      // Log the patched value
      console.log('Name patched here:', this.billform.get('customerName')?.value);
    } else {
      console.log('Invalid data received for patching');
    }
  }


  createCustomer(print: boolean) {

    if (true) {
      this.billform.patchValue({
        id: null,
      })
      const bill: Bill = {
        billSequence: parseInt(this.billform.get('billSequence')?.value),
        amount: parseInt(this.billform.get('amount')?.value),
        billSerial: String(this.billform.get('billSerial')?.value),
        billDate: this.formatDateToYYYYMMDD(this.billform.get('billDate')?.value),
        billNo: parseInt(this.billform.get('billNo')?.value),
        careOf: this.billform.get('careOf')?.value != null ? this.billform.get('careOf')?.value : null,
        productTypeNo: parseInt(this.billform.get('productTypeNo')?.value),
        amountInWords: String(this.billform.get('AmountInWords')?.value),
        presentValue: parseInt(this.billform.get('presentValue')?.value),
        grams: parseFloat(this.billform.get('grams')?.value),
        monthlyIncome: parseInt(this.billform.get('monthlyIncome')?.value),
        redemptionDate: this.billform.get('redemptionDate')?.value != null ? this.billform.get('redemptionDate')?.value : null,
        redemptionInterest: parseFloat(this.billform.get('redemptionInterest')?.value),
        redemptionTotal: parseFloat(this.billform.get('redemptionTotal')?.value),
        redemptionStatus: this.billform.get('redemptionStatus')?.value != null ? this.billform.get('redemptionStatus')?.value : 'O',
        billRedemSerial: this.billform.get('billRedemSerial')?.value != null ? this.billform.get('billRedemSerial')?.value : null,
        billRedemNo: parseInt(this.billform.get('billRedemNo')?.value),
        comments: this.billform.get('comments')?.value != null ? this.billform.get('comments')?.value : null,
        receivedinterest: this.billform.get('receivedinterest')?.value != null ? this.billform.get('receivedinterest')?.value : 0,
        oldbillserialno: String(this.billform.get('oldbillserialno')?.value),
        interestinmonths: this.billform.get('interestinmonths')?.value != null ? this.billform.get('interestinmonths')?.value : null,
        // comments:this.billform.get
        customer: this.getCustomer(),
        rateOfInterest: parseFloat(this.billform.get('rateOfInterest')?.value),
        image_path: this.billform.get('image_path')?.value,
        billDetails: this.getBillDetails(),
      }


      const billDetails: BillDetail = {
        productNo: parseInt(this.billform.get('productNo')?.value),
        productDescription: this.itemControl.value || '',
        productQuantity: parseInt(this.billform.get('productQuantity')?.value),
        articlephoto: undefined
      };




      this.saveCustomer(bill, print);
      // this.load=false
      this.isSuccess = true;

    }
  }
  onSubmitEnter(event: Event) {
    event.preventDefault();
    this.submitPrint(this.billform.value, false)

  }
  onSubmit(form: any, print = false) {
    if (this.billform.valid) {

      console.log('inside submit and the form got validation')
      this.createCustomer(print);
    }

    //  this.resetForm()

  }
  submitPrint(form: any, print = false) {
    console.log('check this ', this.billform);

    if (this.billform.valid && this.myControl.valid) {
      console.log('inside valid form ', this.billform);
      this.createCustomer(print);
    } else {
      // Find invalid controls and show them in snackbar
      const invalidControls = this.findInvalidControls(this.billform);

      // if (invalidControls.length > 0) {
      //   const errorMessage = `Please check the following fields: ${invalidControls.join(', ')}`;
      //   this.snackBar.open(errorMessage, 'Close', {
      //     duration: 3000,
      //     verticalPosition: 'bottom',
      //   });
      // }
    }
  }
  @ViewChild('fileInput') fileInput!: ElementRef;

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }


  // Helper function to find invalid controls
  findInvalidControls(formGroup: FormGroup): string[] {
    const invalidControls: string[] = [];

    // Loop through all controls in the formGroup
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);

      // Check if the control is invalid
      if (control && control.invalid) {
        invalidControls.push(this.getFieldName(key)); // Map field names to user-friendly ones
      }
    });

    // Add checks for individual controls declared outside the formGroup
    if (this.myControl && this.myControl.invalid) {
      invalidControls.push('Customer Name'); // User-friendly name for 'myControl'
    }
    return invalidControls;
  }


  // Helper function to map form control keys to user-friendly names
  getFieldName(key: string): string {
    const fieldNames: Record<string, string> = {
      billSerial: 'Bill Serial',
      billNo: 'Bill Number',
      customerName: 'Customer Name',
      fullAddress: 'Full Address',
      productTypeNo: 'Product Type Number',
      amount: 'Amount',
      grams: 'Grams',
      productQuantity: 'Product Quantity',
      productDescription: 'Product Description',
      presentValue: 'Present Value',
      rateOfInterest: 'Rate of Interest',
      billDate: 'Bill Date',
      AmountInWords: 'Amount in Words',
      // Add more mappings if needed
    };

    return fieldNames[key] || key; // Return the field name or the key itself if not mapped
  }

  IsNull(value: string) {
    return value != null ? value : "";
  }
  IsIntNull(value: number) {
    return value != null && value > 0 ? value : "";
  }

  formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  saveCustomer(bill: Bill, _print = false) {
    //this.load=true


    const photoFile = this.selectFiles; // e.g., from a file input event
    const articlephoto = this.selectFiles1
    console.log('check this bill transferreeddddd file ..........', bill);

    // Prepare the form data with the bill and the photo
    const formData = new FormData();
    formData.append('bill', new Blob([JSON.stringify(bill)], { type: 'application/json' }));
    formData.append('photo', this.selectFiles);
    formData.append('articlephoto', articlephoto);

    console.log('file gone ', this.selectFiles);
    console.log('Bill gone', new Blob([JSON.stringify(bill)], { type: 'application/json' }));

    if (this.selectFiles) {
      this.storePhoto(String(bill.customer.customerid), this.selectFiles);
    }
    if (this.Update) {
      console.log('form data::::', formData)
      this.userService.updatePledgeBill(this.billSequence, formData).subscribe((resp: any) => {
        //this.load=false
        if (this.userService.getUserByIdForWhatsapp()) {
          this.message(resp)
        }
        console.log(resp)
        this.addToLocalStorageArray({ bill: bill, type: 'updated' })
        this.appcomp.loadTransactions()
        this.snackBar.open('Bill Updated successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
        });
        this.resetForm();
        if (_print === true) {
          this.printFunctionality(this.billSequence);
        }
        // Proceed with the print dialogs if _print is true

        //this.fetchNextBillNumbers()

      })
    } else {
      this.userService.createBill(formData).subscribe(
        (response) => {
          //this.load=false

          this.addToLocalStorageArray({ bill: bill, type: 'pledged' })
          this.appcomp.loadTransactions()
          console.log('Bill successfully saved:', response);
          const savedBill: Bill = response.bill;
          console.log("seeeeeeeee herrrreee what u recieve as response ", savedBill);
          if (this.userService.getUserByIdForWhatsapp()) {
            this.message(savedBill)
          }
          //this.fetchNextBillNumbers()
          // this.addToLocalStorageArray(bill)
          this.snackBar.open('Bill successfully Pledged', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
          });
          if (_print === false) {
            this.resetForm();
          }
          if (_print === true) {
            this.printFunctionality(savedBill?.billSequence);
          }
          // Proceed with the print dialogs if _print is true
          //this.fetchNextBillNumbers()
        },
        (error) => {
          console.error('Error saving bill:', error);
          this.snackBar.open('Error Pledging bill', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
          });
        }
      );
    }
    setTimeout(() => {
      this.customerInput.nativeElement.focus();


    }, 0);

  }

  // Save the bill using the user service

  // Common function to print the PDF
  private printPdf(response: Blob) {
    const blob = new Blob([response], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);

    // Create an iframe to load the PDF and trigger print
    const iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden'; // Hide the iframe, but keep it in the DOM
    iframe.src = blobUrl;

    // Append the iframe to the document body
    document.body.appendChild(iframe);

    // Trigger the print dialog once the iframe is loaded
    iframe.onload = () => {
      // Ensure content is fully loaded and focused
      iframe.contentWindow?.focus();

      // Check if contentDocument is available
      const contentDoc = iframe.contentDocument;
      if (contentDoc) {
        // Add custom styles to set paper size and scaling
        const style = contentDoc.createElement('style');
        style.innerHTML = `
            @page {
              size: A4; /* Set paper size to A4 */
              margin: 0; /* Set margin to 0 for full content fit */
            }
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            /* Scale content to fit page size */
            iframe {
              width: 100%;
              height: 100%;
              transform: scale(0.8); /* Adjust scaling factor as needed */
              transform-origin: 0 0;
            }
          `;
        contentDoc.head.appendChild(style);

        // Delay the print trigger to ensure mobile browsers have time to process
        setTimeout(() => {
          iframe.contentWindow?.print();
        }, 500); // Adjust delay time if needed
      }
    };

    // Listen for the 'afterprint' event and remove the iframe
    window.addEventListener('afterprint', () => {
      document.body.removeChild(iframe);
    });
  }



  displayFn(customer: Customer): string {
    return customer && customer.customerName ? customer.customerName : '';
  }
  message(savedBill: Bill) {
    let shop_name
    //this.load=true
    this.userService.getSettings().subscribe((resp: any) => {

      shop_name = this.userService.getMySettingParamValueById('SHOP_NAME', resp)
    })
    if (shop_name) {
      this.userService.whatsappPledge(savedBill, shop_name).pipe(
        catchError((error) => {
          //this.load=false

          // Handle the error here
          console.error('Error occurred while sending pledge:', error);

          // Optional: You can show a user-friendly message or notification using snackBar, alert, etc.
          this.snackBar.open('An error occurred while sending pledge details. Please try again.', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
          });

          // Return an observable with a default or empty value so the stream can continue
          return of(null);
        })
      ).subscribe({
        next: (resp: any) => {
          //this.load=false

          // Handle the response here
          console.log('Pledge sent successfully:', resp);

          // Show a success message when the pledge is sent successfully
          this.snackBar.open('Message sent successfully!', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
          });

          // Optionally, you can add logic here to navigate to a different page or show further information
        },
        error: (error) => {
          // This will also catch any unhandled errors, though it's typically redundant when using `catchError`
          console.error('Error occurred while processing pledge:', error);
          this.snackBar.open('Error while processing. Please try again later.', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
          });
        },
      });
    }

  }
  iscs = false
  customerPhoto: any
  onTabOut(event: KeyboardEvent): void {

    if (event.key === 'Tab') {
      console.log('Tab key pressed!');
      this.performTabOutAction();
    }
  }
  onFocus(event: FocusEvent): void {
    console.log('Input field focused');
    this.performTabOutAction();
    // Handle focus event (you can detect which field is focused)
  }

  onBlur(event: FocusEvent): void {
    console.log('Input field blurred');
    this.performTabOutAction();
  }


  onTabOut2(event: KeyboardEvent): void {

    if (event.key === 'Tab') {
      console.log('Tab key pressed!');
      this.oldBillAction();
    }
  }
  onFocus2(event: FocusEvent): void {
    console.log('Input field focused');
    this.oldBillAction();
    // Handle focus event (you can detect which field is focused)
  }

  onBlur2(event: FocusEvent): void {
    console.log('Input field blurred');
    this.oldBillAction();
  }
  oldBillAction() {
    const value = this.billform.get('oldbillserialno')?.value || ''; // Default to empty string if null/undefined
    const length = value.length;
    if (length < 4) {
      return
    }
    this.fetchBillDetailsByNumber(this.billform.get('oldbillserialno')?.value, 'old')
  }
  base64ToBlob(base64String: any, mimeType = '') {
    // Decode the Base64 string
    const byteCharacters = atob(base64String);

    // Convert binary string to array of bytes
    const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);

    // Create and return the Blob
    return new Blob([byteArray], { type: mimeType });
  }
  performTabOutAction(): void {
    // this.Update=true
    console.log('Handling tab out event...', this.Update);
    const serial = this.billform.get('billSerial')?.value
    const billno = this.billform.get('billNo')?.value
    const mixed = String(serial) + String(billno)
    this.fetchBillDetailsByNumber(mixed, 'current')
  }
  fetchBillDetailsByNumber(billno: any, type: string) {


    this.userService.billSeialNoSearch(billno).subscribe((resp: any) => {
      console.log('called this')
      console.log(new Date)


      console.log('this is whatit s:::::::::::', resp[0])
      if (!resp[0]) {
        console.log('reset reached here be happy')
        this.resetForm(false)
        return
      }
      const bill = resp[0]
      const date = new Date(bill.billDate || '');
      const formattedDate = date
      const articlePhoto = bill.billDetails[0].articlephoto
      const b = this.getImageUrl(articlePhoto)
      this.photoPreview1 = b
      this.selectFiles1 = this.base64ToBlob(articlePhoto)
      // this.selectFiles

      this.cdr.detectChanges()


      console.log('This is Bill thts it', bill, bill.productTypeNo)
      this.retrievePhoto(String(bill.customer.customerid))
      if (this.photoPreview == null) {
        const a = this.getImageUrl(bill.customer.photo)
        if (bill.customer.photo) {
          this.photoPreview = a
          this.cdr.detectChanges()
        }
        else {
          this.photoPreview = null
        }

      }
      if (resp === undefined || resp === null) {
        console.log('In bill undefined case')
        this.snackBar.open('No Bill found', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
        });
      } else {
        // Log the entire bill object for debugging
        console.log('Received bill object:', bill);

        // Check for 'customer' property and its structure
        if (bill.customer !== undefined && bill.customer !== null) {
          console.log('This is the product description:', bill);
          this.billSequence = bill.billSequence
          this.billform.patchValue({
            //customerName: bill.customer.customerName || '',
            billDate: formattedDate,

            productQuantity: (bill.billDetails && bill.billDetails.length > 0) ? bill.billDetails[0].productQuantity || '' : '',
            customerid: bill.customer.customerid || '',
            mailid: bill.customer.mailid || '',
            fullAddress: bill.customer.address || '',
            grams: bill.grams || '',
            proofType: bill.customer.proofType || '',
            proofDetails: bill.customer.proofDetails || '',
            productTypeNo: bill.productTypeNo || '',
            rateOfInterest: bill.rateOfInterest || '',
            presentValue: bill.presentValue || '',
            AmountInWords: bill.amountInWords || '',
            monthlyIncome: bill.monthlyIncome || '',
            comments: bill.comments || '',
            amount: bill.amount || '',
          });
          if (type == 'current') {
            if (this.billSequence > 0) {
              this.Update = true;
            }
            this.billform.patchValue({
              oldbillserialno: bill.oldbillserialno || '',
            })

          }
          if (type == 'old') {
            this.billform.patchValue({
              oldbillserialno: this.billform.get('oldbillserialno')?.value,
            })

          }
          this.itemControl.patchValue((bill.billDetails && bill.billDetails.length > 0) ? bill.billDetails[0].productDescription || '' : '')
          this.myControl.patchValue(bill.customer.customerName || '')

          this.phoneControl.patchValue(bill.customer.phoneno || '')
          console.log('item photo us herrrrrre eee.....................', this.selectFiles1, this.selectFiles)
        } else {
          // Handle case where customer information is not present
          this.snackBar.open('Customer information not available', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
          });
          this.billform.patchValue({
            fullAddress: '',
            mailid: '',
            proofDetails: '',
            proofType: 'A',
            customerid: '',
            billDate: new Date(),
            productQuantity: '',
            grams: '',
            rateOfInterest: '',
            oldbillserialno: '',
            presentValue: '',
            AmountInWords: '',
            monthlyIncome: '',
            comments: '',
            amount: ''


          })
          this.itemControl.patchValue('')

          this.photoPreview = null
          this.phoneControl.patchValue('')
          console.log('Bill object does not contain customer information:', bill);
        }
      }

    })

  }



  fetchCustomerData(customerName: string): void {
    this.userService.customerTotal(customerName).subscribe((resp: any) => {
      this.dataSource.data = resp;
      this.openCustomerCopyDialog(resp); // Open dialog with the fetched data
    });
  }
  openCustomerCopyDialog(data: any): void {
    console.log('gvsmabdbdsajbhjsdfnjbdsanbdsjnbdfsjndjndfnn', data)
    if (data.message) {
      return
    }
    const dialogRef = this.dialog.open(CustomerCopyComponent, {
      width: '90%', // Adjust width for responsiveness
      maxWidth: '800px', // Maximum width
      panelClass: 'dialog-container', // Apply the CSS class
      data: data // Pass the fetched data to the dialog
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog closed with: ', result);
      } else {
        console.log('Dialog closed without confirmation.');
      }
    });
  }

  onCustomerSelected1(event: KeyboardEvent) {
    console.log('getting called ')
    if (event.key === 'Tab' && this.myControl.value) {
      console.log('getting called ', this.myControl.value)

      this.onCustomerSelected(this.myControl.value)
    }

  }
  onPhoneSelected1(event: KeyboardEvent) {
    console.log('getting called ')
    if (event.key === 'Tab' && this.phoneControl.value) {
      console.log('getting called ', this.myControl.value)

      this.onPhoneSelected(this.phoneControl.value)
    }

  }


  onCustomerSelected(customerName: string) {
    this.photoPreview = ''
    this.selectFiles = ''
    this.fetchCustomerData(customerName)


    console.log('options', this.options)
    const selectedCustomer = this.options.find(option => option.customerName?.toLowerCase() === customerName.toLowerCase());
    console.log('selectedcustomer', selectedCustomer)
    if (selectedCustomer) {
      console.log("selected");
      this.isNewCustomer = false
      setTimeout(() => {
        this.amountInput.nativeElement.focus();
      }, 0);

      const fullAddress1 = selectedCustomer.address;
      // const fullAddress1 = `${selectedCustomer.area}, ${selectedCustomer.street}, ${selectedCustomer.district}, ${selectedCustomer.country} - ${selectedCustomer.pincode}`;
      console.log("fullAddress: ", fullAddress1)
      // this.isNewCustomer=false

      this.billform.patchValue({ fullAddress: fullAddress1 });
      this.myControl.patchValue(selectedCustomer.customerName);
      this.billform.patchValue({ customerid: selectedCustomer.customerid });
      this.billform.patchValue({
        // phoneno: selectedCustomer.phoneno ,
        proofType: selectedCustomer.proofType,
        mailid: selectedCustomer.mailid,
        proofDetails: selectedCustomer.proofDetails,

      });
      this.iscs = true
      if (selectedCustomer.phoneno == 0 || selectedCustomer.phoneno == '') {

      }
      else {
        this.phoneControl.patchValue(selectedCustomer.phoneno)

      }

      //this.photoPreview=selectedCustomer.imagePath
      this.retrievePhoto(String(selectedCustomer.customerid))
      if (this.photoPreview === '') {
        const a = this.getImageUrl(selectedCustomer.photo)
        if (selectedCustomer.photo) {
          this.photoPreview = a
          this.cdr.detectChanges
        }

      }





    }
    else {
      this.isNewCustomer = true
      setTimeout(() => {
        this.pincodeInput.nativeElement.focus();
      }, 0);
      this.billform.patchValue({
        fullAddress: '',
        mailid: '',
        proofDetails: '',
        proofType: 'A',
        customerid: ''



      })
      if (this.userService.isMobileScreen()) {
        this.isNewCustomer = false

      }
      else {
        this.isNewCustomer = true
        setTimeout(() => {
          this.pincodeInput.nativeElement.focus();
        }, 0);
      }
      this.phoneControl.patchValue('')
      this.photoPreview = null
    }
  }
  getImageUrl(base64String: string, imageType = 'jpeg'): string {
    return `data:image/${imageType};base64,${base64String}`;
  }

  updateAmountInWords(event: any) {
    const inputElement = event.target as HTMLInputElement;
    const amount = inputElement.value;

    if (amount) {
      const amountValue = parseFloat(amount); // Convert input value to a number if needed
      const amountWords = this.convertAmountToWords(amountValue);
      this.billform.patchValue({ AmountInWords: amountWords });
    } else {
      this.billform.patchValue({ AmountInWords: '' }); // Handle case when amount is emonsubpty or invalid
    }
  }
  updateAmountInWordsNan() {
    console.log("in updating amount in words by aooo", this.billform.get("amount")?.value)
    const amount = this.billform.get("amount")?.value;

    if (amount) {
      console.log("bro noooo ammooounr is there ")

      const amountValue = parseFloat(amount); // Convert input value to a number if needed
      const amountWords = this.convertAmountToWords(amountValue);
      this.billform.patchValue({ AmountInWords: amountWords });
    } else {
      this.billform.patchValue({ AmountInWords: '' }); // Handle case when amount is emonsubpty or invalid
    }
  }

  convertAmountToWords(amount: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (amount === 0) {
      return 'Zero Rupees Only';
    }

    if (amount >= 100000000) {  // Check if amount exceeds 10 crore limit
      return 'Amount exceeds 10 Crore';
    }

    let words = '';

    function convertLessThanHundred(number: number): string {
      if (number < 10) {
        return ones[number];
      } else if (number === 10) {  // Handle the case for 10 separately
        return tens[1];  // "Ten"
      } else if (number < 20) {
        return teens[number - 11];
      } else {
        const tensDigit = Math.floor(number / 10);
        const unitDigit = number % 10;
        return tens[tensDigit] + (unitDigit ? ' ' + ones[unitDigit] : '');
      }
    }

    // Convert Crores
    if (amount >= 10000000) {
      const crore = Math.floor(amount / 10000000);
      words += convertLessThanHundred(crore) + ' Crore ';
      amount %= 10000000;
    }

    // Convert Lakhs
    if (amount >= 100000) {
      const lakh = Math.floor(amount / 100000);
      words += convertLessThanHundred(lakh) + ' Lakh ';
      amount %= 100000;
    }

    // Convert Thousands
    if (amount >= 1000) {
      const thousand = Math.floor(amount / 1000);
      words += convertLessThanHundred(thousand) + ' Thousand ';
      amount %= 1000;
    }

    // Convert Hundreds
    if (amount >= 100) {
      const hundred = Math.floor(amount / 100);
      words += convertLessThanHundred(hundred) + ' Hundred ';
      amount %= 100;
    }

    // Convert Tens and Units
    if (amount > 0) {
      words += convertLessThanHundred(amount);
    }

    words += ' Rupees Only';
    return words.trim();
  }
  presentvalue() {
    const wei = this.billform.get('grams')!.value;
    const amo = this.billform.get('amount')!.value;
    const art = this.billform.get('productTypeNo')!.value;
    console.log('executing........................................')

    if (wei == '' || amo == '' || art == '') {
      console.log('executing........................................');
      return;
    }


    console.log("GOLD" + this.getProductTypeNo("GOLD"));
    if (art == this.getProductTypeNo("GOLD")) {
      const tot = wei * 3000
      if (tot <= amo) {
        const tot2 = parseInt(amo) + 200
        this.billform.patchValue({ presentValue: tot2 })
      }
      else if (tot > amo) {
        this.billform.patchValue({ presentValue: tot })
      }

    }
    else if (art == this.getProductTypeNo("SILVER")) {
      const tot = wei * 35
      if (tot <= amo) {
        const tot2 = Number(amo) + 100
        this.billform.patchValue({ presentValue: tot2 })
      }
      else if (tot > amo) {
        this.billform.patchValue({ presentValue: tot })
      }


    }
  }

  roiacess() {
    console.log('in roi access');

    const goldProducts = this.productOptions.filter((item: { productTypeCode: string }) => item.productTypeCode === 'GOLD');
    const silverProducts = this.productOptions.filter((item: { productTypeCode: string }) => item.productTypeCode === 'SILVER');

    const art = this.billform.get('productTypeNo')!.value;
    const amo = this.billform.get('amount')!.value;

    // Handle gold products
    const goldProduct = goldProducts.find((product: { productTypeNo: any; }) => product.productTypeNo === art);
    if (goldProduct) {
      if (amo <= 5000) {
        this.billform.patchValue({ rateOfInterest: this.goldROI5K });
      } else if (amo > 5000 && amo < 10000) {
        this.billform.patchValue({ rateOfInterest: this.goldROI10K });
      } else if (amo >= 10000 && amo <= 20000) {
        this.billform.patchValue({ rateOfInterest: this.goldROI20K });
      } else if (amo > 20000 && amo <= 50000) {
        this.billform.patchValue({ rateOfInterest: this.goldROI50K });
      } else if (amo > 50000 && amo < 100000) {
        this.billform.patchValue({ rateOfInterest: this.goldROI100K });
      } else if (amo >= 100000) {
        this.billform.patchValue({ rateOfInterest: this.goldROI100Kplus });
      }
    }

    // Handle silver products
    else if (silverProducts.some((product: { productTypeNo: any; }) => product.productTypeNo === art)) {
      this.billform.patchValue({ rateOfInterest: this.silverROI });
    }

    // Handle other products
    else {
      const matchingProduct = this.productOptions.find((item: { productTypeNo: any; productTypeCode: string }) => item.productTypeNo === art);
      if (matchingProduct) {
        this.billform.patchValue({ rateOfInterest: matchingProduct.rateOfInterest });
      }
    }
  }
  calculateIntrestPledgeAndTotalGive() {
    const roi = parseFloat(this.billform.get('rateOfInterest')!.value) || 0;  // Get rate of interest and ensure it's a number
    const amount = parseFloat(this.billform.get('amount')!.value) || 0;      // Get amount and ensure it's a number

    // Calculate intrestpledge (simple interest calculation)
    const intrestpledge = (roi * amount) / 100;

    // Ensure totalgive is calculated properly (amount + interest)
    const totalgive = amount - intrestpledge;  // Assuming you want to add interest to the amount

    // Update form controls with computed values (formatted to 2 decimal places)
    this.billform.patchValue({
      interstpledge: intrestpledge.toFixed(2),  // Display intrestpledge to two decimal places
      totalgive: totalgive.toFixed(2)           // Display totalgive to two decimal places
    });
  }

  // Example function to toggle disabled state
  toggleBillSerialInput() {
    this.isBillSerialDisabled = !this.isBillSerialDisabled;
  }
  imageUrl: string | ArrayBuffer | null = null;

  generatePdf() {
    const bill = {
      amount: parseInt(this.billform.get('amount')?.value),
      billSerial: String(this.billform.get('billSerial')?.value),
      billDate: String(this.billform.get('billDate')?.value),
      billNo: parseInt(this.billform.get('billNo')?.value),
      careOf: this.billform.get('careOf')?.value || 'N/A',
      productTypeNo: parseInt(this.billform.get('productTypeNo')?.value),
      amountInWords: String(this.billform.get('AmountInWords')?.value),
      presentValue: parseInt(this.billform.get('presentValue')?.value),
      grams: parseInt(this.billform.get('grams')?.value),
      monthlyIncome: parseInt(this.billform.get('monthlyIncome')?.value),
      redemptionDate: this.billform.get('redemptionDate')?.value || 'N/A',
      redemptionInterest: parseInt(this.billform.get('redemptionInterest')?.value),
      redemptionTotal: parseInt(this.billform.get('redemptionTotal')?.value),
      redemptionStatus: this.billform.get('redemptionStatus')?.value || 'N/A',
      billRedemSerial: this.billform.get('billRedemSerial')?.value || 'N/A',
      billRedemNo: parseInt(this.billform.get('billRedemNo')?.value),
      comments: this.billform.get('comments')?.value || 'N/A',
      rateOfInterest: parseInt(this.billform.get('rateOfInterest')?.value),
    };

    const doc = new jsPDF();

    // Page width and height
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 10;
    const marginRight = 10;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Center title
    doc.setFontSize(16);
    doc.text('Bill Details', pageWidth / 2, 20, { align: 'center' });

    // Set font size for content
    doc.setFontSize(12);

    // Bill details
    const lines = [
      `Bill Serial: ${bill.billSerial}`,
      `Bill No: ${bill.billNo}`,
      `Bill Date: ${bill.billDate}`,
      `Amount: ${bill.amount}`,
      `Amount in Words: ${bill.amountInWords}`,
      `Care Of: ${bill.careOf}`,
      `Product Type No: ${bill.productTypeNo}`,
      `Present Value: ${bill.presentValue}`,
      `Grams: ${bill.grams}`,
      `Monthly Income: ${bill.monthlyIncome}`,
      `Redemption Date: ${bill.redemptionDate}`,
      `Redemption Interest: ${bill.redemptionInterest}`,
      `Redemption Total: ${bill.redemptionTotal}`,
      `Redemption Status: ${bill.redemptionStatus}`,
      `Bill Redemption Serial: ${bill.billRedemSerial}`,
      `Bill Redemption No: ${bill.billRedemNo}`,
      `Comments: ${bill.comments}`
    ];

    let yPos = 30; // Initial y position
    lines.forEach(line => {
      // You can center each line or align to right by using {align: 'center'} or {align: 'right'}
      doc.text(line, marginLeft, yPos); // Align to the left
      yPos += 10; // Increase y position for the next line
    });
    doc.save('bill-details.pdf');
    const pdfData = doc.output('bloburl');
    const printWindow = window.open(pdfData);
    printWindow?.print();
  }
  // @ViewChild('fileInput') fileInput: ElementRef | undefined;
  // triggerFileInput(): void {
  //   this.fileInput?.nativeElement.click(); // Simulate a click on the hidden file input
  // }

  resetForm(fetcBillNo = true) {
    this.lastOptionSelected = ''
    //  this.userService.getProductTypes().subscribe((resp:any)=>{
    //   this.productTypes=resp
    //   console.log(resp)
    // })
    let x;
    if (this.productTypes.length != 0) {
      x = this.userService.getProductTypeNoByCode('GOLD', this.productTypes)
    }
    else {
      this.userService.getProductTypes().subscribe((resp: any) => {
        this.productTypes = resp
        console.log(resp)
      })
      x = this.userService.getProductTypeNoByCode('GOLD', this.productTypes)
    }
    this.billform.patchValue({
      //customerName:'',
      grams: '',
      productQuantity: '',
      productTypeNo: x,
      comments: '',
      oldbillserialno: '',
      customerid: '',
      //phoneno:'',
      fullAddress: '',
      presentValue: '',
      AmountInWords: '',
      monthlyIncome: '',
      proofType: 'A',
      proofDetails: '',
      mailid: '',
      totalgive: '',
      interstpledge: '',
      amount: '',
      pincode: '',
      plotNo: '',
      area: ''

    })
    this.myControl.patchValue('')
    this.phoneControl.patchValue('')
    this.photoPreview = null
    this.photoPreview1 = ''
    this.selectFiles = ''
    this.selectFiles1 = ''
    this.itemControl.patchValue('')
    this.isNewCustomer = false
    this.Update = false
    if (fetcBillNo) {
      this.fetchNextBillNumbers()

    }
    if (this.billform.get('isSearchCustomer')?.value) {
      setTimeout(() => {
        this.customerInput.nativeElement.focus()


      }, 0);
    }
    if (!this.billform.get('isSearchCustomer')?.value) {
      setTimeout(() => {
        this.phoneInput.nativeElement.focus()


      }, 0);
    }


  }


  // handleFilePreview(): void {
  //   const filePath = 'C:\\Users\\deepa\\OneDrive\\Pictures\\Screenshots\\Screenshot 2024-09-22 224317.png';
  //   const file = this.createFileFromPath(filePath);


  //   if (file) {
  //     // Update the form control with the file
  //     this.billform.patchValue({
  //       photo: file
  //     });

  //     // Display the image preview using FileReader
  //     const reader = new FileReader();
  //     reader.readAsDataURL(file); // Read file as Data URL (for image preview)
  //     reader.onload = () => {
  //       this.photoPreview = reader.result;  // Assign the base64 data URL to `photoPreview`
  //       //this.triggerFileInput();
  //       console.log('Image preview:', this.photoPreview);  // Log the result to verify
  //     }; 
  //   }}

  // Handle file selection
  onFileChange(event: Event): void {
    console.log('in file change customer.........................................');
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectFiles = file; // Store the selected file

      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string; // Ensure the type is string
        console.log('Photo preview URL:', this.photoPreview); // Debug log

        // Set the file name in the form control
        this.billform.patchValue({
          image_path: file.name,
        });

        console.log('Selected file:', this.selectFiles);

        // Trigger change detection manually
        this.cdr.detectChanges(); // Force change detection
      };

      reader.readAsDataURL(file); // Read the file as a data URL
    } else {
      console.log('No file selected.');
    }
  }     // Function to get productTypeNo by productTypeCode
  getProductTypeNo(productTypeCode: string): number | undefined {
    const product = this.productTypes.find(pt => pt.productTypeCode === productTypeCode);
    return product?.productTypeNo; // This will return undefined if no match is found
  }
  printFunctionality(billSequence: any) {


    this.userService.generateBillPdf(billSequence).subscribe(
      (response: Blob) => {
        this.printPdf(response); // Print customer copy
        this.resetForm();

      },
      (error) => {
        console.error('Error generating Print:', error);
        this.snackBar.open('Error generating Print', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
        });
      }
    );
  }

  productphotchange(event: Event): void {
    console.log('in file change');
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectFiles1 = file; // Store the selected file

      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview1 = reader.result as string; // Ensure the type is string
        console.log('Photo preview URL:', this.photoPreview1); // Debug log

        // Set the file name in the form control
        this.billform.patchValue({
          image_path: file.name,
        });

        console.log('Selected file:', this.selectFiles1);

        // Trigger change detection manually
        this.cdr.detectChanges(); // Force change detection
      };

      reader.readAsDataURL(file); // Read the file as a data URL
    } else {
      console.log('No file selected.');
    }
  }     // Function to get productTypeNo by productTypeCode


}

interface Window {
  webkitSpeechRecognition: any;
}


export interface ProductTypes {
  productTypeNo: number;
  productTypeCode: string;
  productTypeDescription: string;
  rateOfInterest: number;

}