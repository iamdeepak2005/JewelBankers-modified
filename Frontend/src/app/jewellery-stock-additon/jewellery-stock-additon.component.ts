import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { JewelleryHeaderComponent } from "../jewellery-header/jewellery-header.component";
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChangeDetectionStrategy } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { debounceTime, map, Observable, of, startWith, switchMap } from 'rxjs';
import { Customer } from '../add-customer/Customer';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Item } from './stock';
import { Transaction } from './transcition';
import { JewellerItemStockingService } from '../jeweller-item-stocking.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { HeaderComponent } from '../header/header.component';
import { Supplier } from '../jewellery/models/supplier';
import { NewsupplierComponent } from '../newsupplier/newsupplier.component';
import { MatDialog } from '@angular/material/dialog';
import { NewitemComponent } from '../newitem/newitem.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HotkeysService, Hotkey } from 'angular2-hotkeys';

@Component({
  selector: 'app-jewellery-stock-additon',
  standalone: true,
  providers: [provideNativeDateAdapter(), DatePipe],
  imports: [
    JewelleryHeaderComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatButtonToggleModule,
    ScrollingModule,
    HeaderComponent,
    MatSnackBarModule
  ],
  templateUrl: './jewellery-stock-additon.component.html',
  styleUrl: './jewellery-stock-additon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('rowAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(-50px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
  ],

})
export class JewelleryStockAdditonComponent implements AfterViewInit {
  options: any[] = [];
  filteredOptions: Observable<string[]> | undefined;
  myControl = new FormControl('', [Validators.required]);
  form!: FormGroup;
  sellingForm!: FormGroup;
  tradingForm!: FormGroup;
  prices!: FormGroup;
  main!: FormGroup
  filters = new FormControl();
  @ViewChild('xyz') paginator1!: MatPaginator;
  @ViewChild('xyz1') paginator!: MatPaginator;
  @ViewChild('itemnameInput', { static: false }) itemnameInput!: ElementRef;
  @ViewChild('itemnameInputPurchase', { static: false }) itemnameInputPurchase!: ElementRef;
  @ViewChild('itemnameInputSelling', { static: false }) itemnameInputSelling!: ElementRef;
  @ViewChild('myInput', { static: false }) myInput!: ElementRef;
  @Input() items$!: Observable<Item[]>;
  filteredItemOptions: Observable<string[]>[] = [];
  toggling: FormControl = new FormControl(false);
  pageEvent1: any;
  displayedColumns1: string[] = ['date', 'itemsTraded', 'totalAmountTraded'];
  dataSource1 = new MatTableDataSource<any>([]);
  transactions !: Transaction[]
  shopName: any;
  toggleForm: FormGroup<{
    toggling: FormControl<string | null>;
  }>;
  shopAddress: string | undefined;
  isCustomerNew: boolean = false;
  isSupplierNew: boolean = false;
  suppliers!: any[];
  SupplierSelected: Supplier | null = null;
  totalAmount: number = 0;
  totalPurchaseAmount: number = 0;
  totalTradingAmount: number = 0;
  customerSelected: any;
  isInputVisible = true;
  private hotkeys: Hotkey[] = [];
  private wastagePerGram = 0.0134;

  constructor(private cdr: ChangeDetectorRef,
    private userService: UserService,
    private fb: FormBuilder,
    private jewelleryItemStocks: JewellerItemStockingService,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar,
    private hotkeysService: HotkeysService
    
  ) {
    this.toggleForm = new FormGroup({
      toggling: new FormControl()
    });
    this.prices = new FormGroup({
      cgst: new FormControl(),
      sgst: new FormControl(),
      pType: new FormControl(),
      total: new FormControl(),
      discountPrice: new FormControl(),
      discountedAmount: new FormControl()
    });
    this.main = new FormGroup({
      date: new FormControl([''])
    })
  }


  ngAfterViewInit() {
    setTimeout(() => {
      if (this.myInput?.nativeElement) {
        this.myInput.nativeElement.focus();
      } else {
        console.error('myInput.nativeElement is not ready');
      }
    }); this.dataSource1.data = this.transactions;
    this.dataSource1.paginator = this.paginator1;

  }


  ngOnInit() {
    this.jewelleryItemStocks.items$.subscribe((items) => {
      console.log('the function is called dont worry',items)
      this.addRowSelling(items)
    });
    this.hotkeys = [
      new Hotkey('alt.+', () => {
        this.performAction('+');
        return false;
      }),
      new Hotkey('alt.-', () => {
        this.performAction('-');
        return false;
      }),
      new Hotkey('ctrl.s', () => {
        this.onSubmit();
        return false;
      }),
      new Hotkey('ctrl.p', () => {
        this.onSubmitPrint();
        return false;
      }),
      new Hotkey('ctrl.r', () => {
        this.performAction('reset');
        return false;
      }),
    ];

    this.hotkeys.forEach((hotkey) => this.hotkeysService.add(hotkey));
        this.userService.getItems().subscribe((resp: any) => {
      console.log(resp)
      localStorage.setItem('items', JSON.stringify(resp));
    })
    this.userService.getSettings().subscribe(settings => {
      this.shopName = this.userService.getMySettingParamValueById('SHOP_NAME', settings);
      this.shopAddress = `${this.userService.getMySettingParamValueById('SHOP_NO', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_STREET', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_AREA', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_CITY', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_PINCODE', settings) || ''} ${this.userService.getMySettingParamValueById('SHOP_STATE', settings) || ''}`;
    });
    this.toggleForm.get('toggling')?.valueChanges.subscribe((value: string | null) => {
      if (value) {
        localStorage.setItem('toggling', value);
      }
    });
    this.toggleForm.patchValue(
      {
        toggling: localStorage.getItem('toggling')
      }
    )


    this.form = this.fb.group({
      items: this.fb.array([]) // Initially one row
    });
    this.updateAutocompleteOptions1();
    this.tradingForm = this.fb.group({
      items: this.fb.array([]) // Initially one row
    });
    this.updateAutocompleteOptions2();

    this.sellingForm = this.fb.group({
      items: this.fb.array([]) // Initially an empty array
    });


    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => this._filterSupplier(value || '')),
    );
    // Listen to value changes on the entire FormArray
    this.sellingFormArray.valueChanges.subscribe((resp: any) => {
      this.calculateTotalAmount();

      console.log('Form Array changed:', resp);

      // Iterate over each form group and apply the calculations
      this.sellingFormArray.controls.forEach((control, index: number) => {
        if (control instanceof FormGroup) {
          console.log('it wentinside')
          const values = control.value;
          //this.sellingGrandTotal+=parseInt(values.totalamount);

          const wasatge = values.wastagepercent || 0;
          // Calculate netWt (grossWt - stoneWeight)
          const netWt = values.grossWt - values.stoneweight;

          // Calculate totalAmount (qty * amount)
          const amount = values.qty * values.rate * values.grossWt;
          let totalAmount
          if (values.qty == 0) {
            totalAmount = 0;
          }
          else {
            totalAmount =values.qty * parseFloat(values.rate) * (parseFloat(values.grossWt)+parseFloat(values.wastagepercent)); 
          }

          // Update the form controls with the calculated values
          control.patchValue({
            totalamount: totalAmount, // Update totalAmount field
            netWt: netWt, // Update netWt field
            amount: amount, // Update totalamount field
          }, { emitEvent: false }); // Avoid triggering valueChanges again
        }
      });

    });
    this.form.valueChanges.subscribe(() => {
      this.calculateTotalAmountPurchase();
    });
    this.tradingForm.valueChanges.subscribe(() => {
      this.calculateTotalAmountTrading();
    });


  }
  createRow(): FormGroup {
    return this.fb.group({
      itemid: [''],
      itemname: ['', Validators.required],
      qty: ['', Validators.required],
      grossWt: ['', Validators.required],
      stoneweight: [0, Validators.required],
      netWt: ['', Validators.required],
      purity: ['', Validators.required],
      rate: ['', Validators.required],
      amount: [0, Validators.required],
      wastagepercent: [this.wastagePerGram, Validators.required],
      totalamount: ['', Validators.required]
    });
  }
  calculateTotalAmountPurchase() {
    this.totalPurchaseAmount = this.formArray.controls.reduce((sum, group) => {
      const amount = group.get('totalamount')?.value || 0;
      return sum + parseFloat(amount);
    }, 0);
  }
  calculateTotalAmountTrading() {
    this.totalTradingAmount = this.tradingFormArray.controls.reduce((sum, group) => {
      const amount = group.get('totalamount')?.value || 0;
      return sum + parseFloat(amount);
    }, 0);
  }
  subscribeToFieldChanges(group: FormGroup, index: number): void {
    // Listen to changes in qty and amount
    group.get('qty')?.valueChanges.subscribe(() => {
      this.updateTotalAmount(group, index);
    });

    group.get('amount')?.valueChanges.subscribe(() => {
      this.updateTotalAmount(group, index);
    });

    // Listen to changes in grossWt and stoneweight to calculate netWt
    group.get('grossWt')?.valueChanges.subscribe(() => {
      this.updateNetWeight(group, index);
    });

    group.get('stoneweight')?.valueChanges.subscribe(() => {
      this.updateNetWeight(group, index);
    });
  }
  calculateTotalAmount(): void {
    this.totalAmount = this.sellingFormArray.controls.reduce((sum, group) => {
      const amount = parseFloat(group.get('totalamount')?.value) || 0; // Ensure it's a valid number
      return sum + amount;
    }, 0);
  }
  

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    // Check if the focused element is an input or textarea
    if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
      if (event.altKey) {
        switch (event.key) {
          case '+':
            event.preventDefault(); // Prevent default behavior (e.g., zoom in)
            this.performAction('+');
            break;
          case '-':
            event.preventDefault(); // Prevent default behavior (e.g., zoom out)
            this.performAction('-');
            break;
          case 'e':
          case 'E': // Handle uppercase 'E' as well
            event.preventDefault(); // Prevent default behavior
            this.performAction('e');
            break;
          default:
            break; // No action for other keys
        }
      }
      if (event.ctrlKey) {
        switch (event.key) {
          case 's':
          case 'S':
            event.preventDefault(); // Prevent default behavior (e.g., zoom in)
            this.onSubmit();
            break;
          case 'p':
          case 'P':
            event.preventDefault(); // Prevent default behavior (e.g., zoom out)
            this.onSubmitPrint();
            break;
          case 'r':
          case 'R':
            event.preventDefault(); // Prevent default behavior (e.g., zoom out)
            this.performAction('reset');
            break;

          default:
            break; // No action for other keys
        }
      }
    }
    else {
      if (event.ctrlKey) {
        switch (event.key) {
          case 's':
          case 'S':
            event.preventDefault(); // Prevent default behavior (e.g., zoom in)
            this.onSubmit();
            break;
          case 'p':
          case 'P':
            event.preventDefault(); // Prevent default behavior (e.g., zoom out)
            this.onSubmitPrint();
            break;
          case 'R':
          case 'r':
            event.preventDefault(); // Prevent default behavior (e.g., zoom out)
            this.performAction('reset');
            break;

          default:
            break; // No action for other keys
        }
      }

    }
  }
  performAction(type: any) {
    if (this.toggleForm.get('toggling')?.value == 'p') {
      if (type == '+') {
        this.addRow1();
      }
      else if (type == '-') {
        this.removeItem(0);
      }
      else if (type == 'e') {
        this.editPurchaseItem(0);
      }
      else if (type == 'reset') {
        this.resetPurchase();
      }
    }
    else if (this.toggleForm.get('toggling')?.value == 's') {
      if (type == '+') {
        this.addSellingRow();
      }
      else if (type == '-') {
        this.removeSellingItem(0);
      }
      else if (type == 'reset') {
        this.resetSelling();
      }
      // else if(type=='e'){
      //   this.editPurchaseItem(0);
      // }
    }
    else if (this.toggleForm.get('toggling')?.value == 'r') {
      if (type == '+') {
        this.addTradingRow();
      }
      else if (type == '-') {
        this.removeTradingItem(0);
      }
      else if (type == 'reset') {
        this.resetTrading();
      }
      // else if(type=='e'){
      //   this.editPurchaseItem(0);
      // }
    }
  }

  updateTotalAmount(group: FormGroup, index: number): void {
    const qty = group.get('qty')?.value;
    const amount = group.get('amount')?.value;

    // Calculate total amount as qty * amount
    const totalAmount = qty * amount;

    // Update the totalamount field
    group.patchValue({
      totalamount: totalAmount
    });
  }
  showSnackbar(message: string, action: string = 'Close', duration: number = 3000): void {
    this.snackBar.open(message, action, {
      duration,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  updateNetWeight(group: FormGroup, index: number): void {
    const grossWt = group.get('grossWt')?.value;
    const stoneWeight = group.get('stoneweight')?.value;

    // Calculate net weight as grossWt - stoneWeight
    const netWeight = grossWt - stoneWeight;

    // Update the netWt field
    group.patchValue({
      netWt: netWeight
    });
  }

  get formArray(): FormArray {
    return this.form.get("items") as FormArray
  }
  get tradingFormArray(): FormArray {
    return this.tradingForm.get("items") as FormArray
  }
  get sellingFormArray(): FormArray {
    return this.sellingForm.get("items") as FormArray
  }
  addRow1() {
    this.formArray.insert(0, this.createItem());
    this.updateAutocompleteOptions1();
    setTimeout(() => {
      this.itemnameInputPurchase.nativeElement.focus(); // Focus on the first element's itemname
    }, 0);

  }
  addTradingRow() {
    this.tradingFormArray.insert(0, this.createItem());
    this.updateAutocompleteOptions2();
    setTimeout(() => {
      this.itemnameInput.nativeElement.focus(); // Focus on the first element's itemname
    }, 0);
  }
  addSellingRow() {
    this.sellingFormArray.insert(0, this.createItem());
    this.updateAutocompleteOptions();
    setTimeout(() => {
      this.itemnameInputSelling.nativeElement.focus(); // Focus on the first element's itemname
    }, 0);
  }
  removeItem(i: number) {
    this.formArray.removeAt(i);
    this.updateAutocompleteOptions1();
  }
  removeTradingItem(i: number) {
    this.tradingFormArray.removeAt(i);
    this.updateAutocompleteOptions2();
  }
  createSellingRow(item: any): FormGroup {
    return this.fb.group({
      itemid: [item.id],
      itemname: [item.itemname, Validators.required],
      qty: [item.qty, Validators.required],
      grossWt: [item.grossWt, Validators.required],
      stoneweight: [item.stoneweight, Validators.required],
      netWt: [item.netWt, Validators.required],
      purity: [item.purity, Validators.required],
      rate: [item.rate, Validators.required],
      amount: [item.amount, Validators.required],
      wastagepercent: [item.wastagepercent, Validators.required],
      totalamount: [item.totalamount, Validators.required]
    });
  }
  addRowSelling(i: any) {
    console.log('kuch nayaa hua hai ')
    this.sellingFormArray.insert(0, this.createSellingRow(i[i.length - 1]));
    this.cdr.detectChanges();
    this.updateAutocompleteOptions();
  }
  removeSellingItem(row: any): void {
    this.sellingFormArray.removeAt(row);
    this.updateAutocompleteOptions();
  }
  resetSelling() {
    this.sellingFormArray.clear();
  }
  resetTrading() {
    this.tradingFormArray.clear();
  }
  resetPurchase() {
    this.formArray.clear();
  }

  transformSalesItems(items: any[]): any[] {
    console.log('Items:', items);  // Log to check the actual data

    if (Array.isArray(items)) {
      return items.map(item => ({
        
        quantity:item.qty,
        grosswt:parseFloat(item.grossWt),
        netwt: parseFloat(item.netWt),
        purity: parseFloat(item.purity),
        rate: parseFloat(item.rate),  // Ensure rate is a number

        //wastagepercent: item.wastagepercent ? parseFloat(item.wastagepercent) : null, // Handle missing wastagepercent
        wastagecharge: item.wastagepercent ? parseFloat(item.wastagepercent)* parseFloat(item.netWt) * parseFloat(item.rate): null,
        makingcharge: item.wastagepercent ? parseFloat(item.wastagepercent)* parseFloat(item.netWt) * parseFloat(item.rate): null, // Handle missing wastagepercent
        //makingpercent: item.wastagepercent ? parseFloat(item.wastagepercent)*0.0134 : null,
        hallmarkcharges: parseFloat(item.purity),
        //gstamount: parseFloat(item.amount), this is not required as gst will be added in sales object
        //adding wastagecharge = makingcharge+ wastagecharge+hallmarkcharge
        amount: parseFloat(item.amount)+(parseFloat(item.wastagepercent)* parseFloat(item.netWt) * parseFloat(item.rate)*2),  // Ensure amount is a number
        weight: parseFloat(item.netWt),  // Use netWt as weight
        //stoneweight: item.stoneweight ? parseFloat(item.stoneweight) : 0, // Default to 0 if stoneweight is empty
        //totalamount: parseFloat(item.totalamount)  // Ensure totalamount is a number

        //Set all foreign keys
        itemid: item.itemid,
        //TODO replace this hardcoded values
        purchaseid: 1,
        purchaseitemid:1

      }));
    } else {
      console.error('Error: Expected items to be an array');
      return [];
    }
  }

  transformItems(items: any[]): any[] {
    console.log('Items:', items);  // Log to check the actual data

    if (Array.isArray(items)) {
      return items.map(item => ({
        itemid: item.itemid,
        wastagepercent: item.wastagepercent ? parseFloat(item.wastagepercent) : null, // Handle missing wastagepercent
        weight: parseFloat(item.netWt),  // Use netWt as weight
        stoneweight: item.stoneweight ? parseFloat(item.stoneweight) : 0, // Default to 0 if stoneweight is empty
        purity: parseFloat(item.purity),
        rate: parseFloat(item.rate),  // Ensure rate is a number
        amount: parseFloat(item.amount),  // Ensure amount is a number
        totalamount: parseFloat(item.totalamount)  // Ensure totalamount is a number
      }));
    } else {
      console.error('Error: Expected items to be an array');
      return [];
    }
  }
  formCreation(form: any) {
    console.log('see this/............',this.SupplierSelected)
    return {
      supplier: this.SupplierSelected,
      purchaseItems: this.transformItems(form.value),
      //invoiceno: null,
      invoiceprefix: 'MJ',
      invoicedatetime: this.selectedDate,
      paymenttype: this.prices.get('pType')?.value,
      comments: '',
      totalamount: this.totalPurchaseAmount,
      //status: 'P',
      gstamount: (parseFloat(this.prices.get('cgst')?.value || '0') + 
      parseFloat(this.prices.get('sgst')?.value || '0')),
      discount: parseFloat(this.prices.get('discountPrice')?.value),
    }
  }

  formSalesCreation(form: any) {
    console.log('see this/............',this.SupplierSelected)
    return {
      customer: this.SupplierSelected,
      salesItems: this.transformSalesItems(form.value),
      //billno: null, //auto generated
      billprefix: 'SB',
      billdate: this.selectedDate,
      paymenttype: 'ONLINE',
      paymentsubtype:this.prices.get('pType')?.value,
      paymentrefno:null,
      paytmentrecieved:null,
      paymentseqno:1,
      salesman: null,
      comments: '',
      billamount : parseFloat(this.prices.get('totalamount')?.value),
      //status: 'P',
      gstamount: (parseFloat(this.prices.get('cgst')?.value || '0') + 
      parseFloat(this.prices.get('sgst')?.value || '0')),
      billdiscount: parseFloat(this.prices.get('discountPrice')?.value),
      totalamount: this.totalAmount,
    }
  }

  formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  onSubmit() {
    if (this.toggleForm.get('toggling')?.value == 'p') {
      this.userService.createPurchase(this.formCreation(this.formArray)).subscribe({
        next: (resp: any) => {
          console.log(resp);
          this.showSnackbar('Purchase created successfully!');
        },
        error: (err: any) => {
          console.error(err);
          this.showSnackbar('Error creating purchase!', 'Retry');
        },
      });
    }

    if (this.toggleForm.get('toggling')?.value == 's') {
      this.userService.createSelling(this.formSalesCreation(this.sellingFormArray)).subscribe({
        next: (resp: any) => {
          console.log(resp);
          this.showSnackbar('Selling created successfully!');
        },
        error: (err: any) => {
          console.error(err);
          this.showSnackbar('Error creating selling!', 'Retry');
        },
      });
    }

    if (this.toggleForm.get('toggling')?.value == 'r') {
      this.userService.createTrading(this.formCreation(this.tradingFormArray)).subscribe({
        next: (resp: any) => {
          console.log(resp);
          this.showSnackbar('Trading created successfully!');
        },
        error: (err: any) => {
          console.error(err);
          this.showSnackbar('Error creating trading!', 'Retry');
        },
      });
    }

    console.log(this.transformItems(this.formArray.value));
    console.log(this.tradingForm.value);
    console.log(this.sellingForm.value);
    console.log(this.prices.value);
  }
  onSubmitPrint() {
  }
  updateAutocompleteOptions(): void {
    console.log('kuch nayaa hua hai ')
    const items = this.sellingForm.get('items') as FormArray;
    this.filteredItemOptions = items.controls.map((control, index) => {
      return control.get('itemname')!.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        switchMap(value => this._filterItems(value))
      );
    });
  }
  updateAutocompleteOptions1(): void {
    console.log('kuch nayaa hua hai ')
    const items = this.form.get('items') as FormArray;
    this.filteredItemOptions = items.controls.map((control, index) => {
      return control.get('itemname')!.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        switchMap(value => this._filterItems(value))
      );
    });
  }
  updateAutocompleteOptions2(): void {
    console.log('kuch nayaa hua hai ')
    const items = this.tradingForm.get('items') as FormArray;
    this.filteredItemOptions = items.controls.map((control, index) => {
      return control.get('itemname')!.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        switchMap(value => this._filterItems(value))
      );
    });
  }
  createItem(): FormGroup {
    return this.fb.group({
      itemid: [''],
      itemname: ['', Validators.required],
      qty: ['', Validators.required],
      grossWt: ['', Validators.required],
      netWt: ['', Validators.required],
      purity: ['', Validators.required],
      rate: ['', Validators.required],
      stoneweight: ['', Validators.required],
      amount: [0, Validators.required],
      wastagepercent: [this.wastagePerGram, Validators.required],
      // finWastage: ['', Validators.required],
      // purityWastage: ['', Validators.required],
      totalamount: ['', Validators.required]
    });
  }


  onSupplierSelected() {
    const value = this.myControl.value?.toLowerCase().trim();

    if (value && this.suppliers) {
      // Search for the supplier in the suppliers array
      const selectedSupplier = this.suppliers.find(
        (supplier: Supplier) => supplier.suppliername?.toLowerCase() === value
      );

      if (selectedSupplier) {
        this.SupplierSelected = selectedSupplier; // Assign to SupplierSelected
        console.log('Selected Supplier:', this.SupplierSelected);
        // Perform your desired actions with the selected supplier
      } else {
        this.SupplierSelected = null; // Clear if no match is found
        console.log('No matching supplier found for the selected value:', value);
        // Handle case where no match is found
        const data = { 'suppliername': value }
        if (this.toggleForm.get('toggling')?.value == 'p') {
          this.openDialog(data);
        }
        else if (this.toggleForm.get('toggling')?.value == 's') {
          this.openCustomerDialog(data);
        }

      }
    } 
    else if (value && this.options){
      const selectedSupplier = this.options.find(
        (supplier: any) => supplier.customerName?.toLowerCase() === value
      );

      if (selectedSupplier) {
        this.SupplierSelected = selectedSupplier; // Assign to SupplierSelected
        console.log('Selected Supplier:', this.SupplierSelected);
        // Perform your desired actions with the selected supplier
      } else {
        this.SupplierSelected = null; // Clear if no match is found
        console.log('No matching supplier found for the selected value:', value);
        // Handle case where no match is found
        const data = { 'suppliername': value }
        if (this.toggleForm.get('toggling')?.value == 'p') {
          this.openDialog(data);
        }
        else if (this.toggleForm.get('toggling')?.value == 's') {
          this.openCustomerDialog(data);
        }

      }
      }
    else {
      this.SupplierSelected = null; // Clear if no value is entered or array is empty
      console.log('No value entered or suppliers array is empty.');
      //this.openDialog(value||'');
    }
  }
  openDialog(supplierName: any): void {
    const dialogRef = this.dialog.open(NewsupplierComponent, {
      data: supplierName,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.SupplierSelected = result
        // Handle the response from the dialog
        console.log('Dialog result:', result);
        this.myControl.patchValue(this.SupplierSelected?.suppliername || '')

        // You can use the result to update your view or perform other actions
      }
    });
  }
  openCustomerDialog(customerName: any): void {
    const dialogRef = this.dialog.open(NewsupplierComponent, {
      data: customerName,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.SupplierSelected = result
        // Handle the response from the dialog
        console.log('Dialog result:', result);
        this.myControl.patchValue(this.customerSelected?.suppliername || '')

        // You can use the result to update your view or perform other actions
      }
    });
  }

  openItemDialog(itemName: any, i: number): void {
    const dialogRef = this.dialog.open(NewitemComponent, {
      data: itemName,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.SupplierSelected = result
        // Handle the response from the dialog
        console.log('Dialog result:', result);
        this.myControl.patchValue(this.SupplierSelected?.suppliername || '')


        // You can use the result to update your view or perform other actions
      }
    });
  }

  openDialogEdit(): void {
    if (this.SupplierSelected) {
      const dialogRef = this.dialog.open(NewsupplierComponent, {
        data: this.SupplierSelected,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.SupplierSelected = result
          console.log('Edit Dialog result:', result);
          this.myControl.patchValue(this.SupplierSelected?.suppliername || '')
        }
      });
    }
    else if (this.customerSelected) {
      const dialogRef = this.dialog.open(NewsupplierComponent, {
        data: this.customerSelected,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.customerSelected = result
          console.log('Edit Dialog result:', result);
          this.myControl.patchValue(this.customerSelected?.suppliername || '')
        }
      });

    }
  }
  selectedDate!: Date ;  // Use Date object

  onDateChange(event: any): void {
    const selectedDateValue = event.value;  // Get the selected date as Date object
    const currentDate = new Date();  // Get current date to retain time

    // Extract the day, month, and year from the selected date
    const day = selectedDateValue.getDate();
    const month = selectedDateValue.getMonth();  // Month is 0-indexed, so no need to add 1
    const year = selectedDateValue.getFullYear();

    // Set the selected date to the new formatted date while retaining the current time
    currentDate.setDate(day);
    currentDate.setMonth(month);
    currentDate.setFullYear(year);

    this.selectedDate = currentDate;  // Update the selectedDate to reflect the new date

    // If you want to log it or display it in a specific format (outside the input field)
    const formattedDate = this.datePipe.transform(this.selectedDate, 'dd/MM/yyyy HH:mm:ss');
    console.log('Formatted Date:', formattedDate);

    // Trigger change detection to ensure any updates to the UI are reflected
    this.cdr.detectChanges();
  }
  private _filter(value: string): Observable<string[]> {

    const input = value.toLowerCase().trim()
    console.log('Input for filtering:', value);

    if (input === '') {
      return of([]);
    }

    return this.userService.getCustomersByName(input).pipe(
      map((resp: Customer[]) => {
        console.log('API response:', resp);
        //this.options = resp;

        let filteredOptions: string[] = [];

        if (resp && resp.length > 0) {
          const customerNames = resp.map(customer => customer.customerName?.toLowerCase() || '');

          filteredOptions = customerNames.filter(option => option.includes(input))
            .map(option => option.toUpperCase());
        }

        if (input && !filteredOptions.includes(input.toUpperCase())) {
          filteredOptions.unshift(input.toUpperCase());
        }

        if (filteredOptions.length === 0) {
          filteredOptions.push(value.toUpperCase());
        }

        return filteredOptions;
      })
    );
  }


  private _filterSupplier(value: string): Observable<string[]> {
    if (this.toggleForm.get('toggling')?.value == 'p') {
      const input = value.toLowerCase().trim();
      console.log('Input for filtering:', value);
  
      if (input === '') {
        return of([]);
      }
  
      return this.userService.getSupplierbyName(input).pipe(
        map((resp: Supplier[]) => {
          this.suppliers = resp;
          console.log('API response:', resp);
          this.options = resp;
  
          let filteredOptions: string[] = [];
  
          if (resp && resp.length > 0) {
            // Map supplier names from response
            const supplierNames = resp.map(supplier => supplier.suppliername?.toLowerCase() || '');
  
            // Filter names based on input and format them
            filteredOptions = supplierNames.filter(option => option.includes(input))
              .map(option => option.charAt(0).toUpperCase() + option.slice(1));
          }
  
          // Ensure input is added to suggestions if not already included
          if (input && !filteredOptions.includes(input.charAt(0).toUpperCase() + input.slice(1))) {
            filteredOptions.unshift(input.charAt(0).toUpperCase() + input.slice(1));
          }
  
          // Default to input if no matches found
          if (filteredOptions.length === 0) {
            filteredOptions.push(value.charAt(0).toUpperCase() + value.slice(1));
          }
  
          return filteredOptions;
        })
      );
  
    }
    else{
      const input = value.toLowerCase().trim();
      console.log('Input for filtering:', value);
  
      if (input === '') {
        return of([]);
      }
  
      return this.userService.getCustomersByName(input).pipe(
        map((resp: Customer[]) => {
            console.log('API response:', resp);
            this.options = resp; // Store the response for further use
            //this.suppliers = resp;
  
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

  }
  trackByFn(index: number, item: any): any {
    return item.id;
  }
  editPurchaseItem(index: any) {
    // Get the item from the FormArray at the specified index
    const item = (this.formArray.at(index) as FormGroup).value;
    console.log('Edit item:', item);

    // Retrieve the JSON string from local storage
    const itemsJson = localStorage.getItem('items');

    if (itemsJson) {
      // Parse the JSON string into an array of objects
      const items = JSON.parse(itemsJson);

      // Search for the item with the matching ID
      const foundItem = items.find((storedItem: any) => storedItem.id === item.itemid);

      if (foundItem) {
        console.log('Found item:', foundItem);
        this.openItemDialog(foundItem, index)
      } else {
        console.log('Item not found for ID:', item.id);
      }
    } else {
      console.log('No items found in local storage.');
    }
  }

  getTransaction(name: string) {
    if (this.toggleForm.get('toggling')?.value == 'p') {
      this.userService.getTransaction(name).subscribe((resp: Transaction[]) => {
        this.transactions = resp;
        this.dataSource1.data = this.transactions;
      })
    }
    else if (this.toggleForm.get('toggling')?.value == 's') {
      this.userService.getTransaction(name).subscribe((resp: Transaction[]) => {
        this.transactions = resp;
        this.dataSource1.data = this.transactions;
      })
    }
    else {
      this.userService.getTransaction(name).subscribe((resp: Transaction[]) => {
        this.transactions = resp;
        this.dataSource1.data = this.transactions;
      })
    }

  }

  private _filterItems(item: string): Observable<string[]> {
    const input = item.toLowerCase().trim();

    // Check if input is empty, return an empty array immediately
    if (input === '') {
      return of([]);
    }

    // Retrieve the items from localStorage
    const storedItems = localStorage.getItem('items');
    if (storedItems) {
      const items = JSON.parse(storedItems); // Parse the stored items

      // Filter the items based on the input and return the item names
      const filteredOptions = items
        .filter((option: any) => option.name.toLowerCase().includes(input))  // Filter by name
        .map((option: any) => option.name);  // Map to only return the names

      // If no matches, return the input value as fallback
      return of(filteredOptions.length > 0 ? filteredOptions : [item]);
    } else {
      // If no items are in localStorage, return the input as a fallback
      return of([item]);
    }
  }

  onItemSelected(itemname: string, i: number): void {
    // Retrieve the items from localStorage
    const storedItems = localStorage.getItem('items');
    if (storedItems) {
      const items = JSON.parse(storedItems); // Parse the stored items

      // Find the selected item by name
      const selectedItem = items.find((item: any) => item.name === itemname);

      if (selectedItem) {
        // If the item is found, log the full JSON object to the console
        console.log('Selected Item:', selectedItem, i);
        this.formArray.at(i).patchValue({
          itemid: selectedItem.id,
          itemname: selectedItem.name,
          // qty: selectedItem.quantity,
          // grossWt: selectedItem.weight,
          // stoneweight: '',
          // netWt: selectedItem.weight-0.2,
          // purity: selectedItem.purity,
          // rate: selectedItem.itemType.currentrate,
          // amount: selectedItem.quantity * selectedItem.itemType.currentrate,
          // wastagepercent: '',
          // totalamount: selectedItem.quantity * selectedItem.itemType.currentrate
        })
      } else {
        // If no matching item is found, log a message
        console.log('Item not found');
        this.openItemDialog({ name: itemname }, i)

      }
    } else {
      console.log('No items in localStorage');
    }
  }


  onItemSelectedPurchase(itemname: string, i: number): void {
    // Retrieve the items from localStorage
    const storedItems = localStorage.getItem('items');
    if (storedItems) {
      const items = JSON.parse(storedItems); // Parse the stored items

      // Find the selected item by name
      const selectedItem = items.find((item: any) => item.name === itemname);

      if (selectedItem) {
        // If the item is found, log the full JSON object to the console
        console.log('Selected Item:', selectedItem, i);
        this.sellingFormArray.at(i).patchValue({
          itemid: selectedItem.id,
          itemname: selectedItem.name,
          qty: selectedItem.quantity,
          grossWt: selectedItem.weight,
          stoneweight: 0,
          netWt: selectedItem.weight - 0.2,
          purity: selectedItem.purity,
          rate: selectedItem.itemType.currentrate,
          amount: selectedItem.quantity * selectedItem.itemType.currentrate,
          wastagepercent: this.wastagePerGram, //Revisit the logic
          totalamount: selectedItem.quantity * selectedItem.itemType.currentrate
        })
      } else {
        // If no matching item is found, log a message
        console.log('Item not found');
        this.openItemDialog({ name: itemname }, i)

      }
    } else {
      console.log('No items in localStorage');
    }
  }
}