import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {ChangeDetectionStrategy} from '@angular/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {provideNativeDateAdapter} from '@angular/material/core';
import {MatIconModule} from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import * as _moment from 'moment';
import {MatSelectModule} from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, ViewChild, ElementRef, OnInit } from '@angular/core';
import {default as _rollupMoment} from 'moment';
import { Bill } from '../pledge/Bill';
import { UserService } from '../user.service';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { Customer } from '../add-customer/Customer';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { AuthService } from '../auth.service';
import { MatDialog } from '@angular/material/dialog';
import { RedeemCopyComponent } from '../redeem-copy/redeem-copy.component';
import { IndexedDbService } from '../indexed-db.service';
import { BillDetail } from '../pledge/BillDetails';
import { AppComponent } from '../app.component';
import { catchError, of } from 'rxjs';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
@Component({
  selector: 'app-redeem',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSnackBarModule,
    HeaderComponent,
    FooterComponent
],
  templateUrl: './redeem.component.html',
  styleUrl: './redeem.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush, 
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
})


export class RedeemComponent implements OnInit  {

  @ViewChild('myInput', { static: false }) myInput!: ElementRef;

    redeemform : FormGroup;
    bill!: Bill;
    transaction: any;

    nextBillRedemNo = 0; 
  data: any;
  error: any;
  foods= [
    {value: 'R', viewValue: 'Redeem'},
    {value: 'O', viewValue: 'Open'},
    {value: 'C', viewValue: 'Cancel'},
  ];
  isPhoto=false
  photoPreview: any;
  redeemStatus:any;
  setting:any
  billfound=false
photoPreview1: any;
  transcript: any;
    constructor(private fb: FormBuilder,private appcomp:AppComponent,private cdr: ChangeDetectorRef,private indexedDbService:IndexedDbService,private dialog: MatDialog, private route: ActivatedRoute, private router: Router, private http: HttpClient,private userService: UserService, private snackBar: MatSnackBar,private authService: AuthService ) {
      this.redeemform = this.fb.group({
        billSerial: ['', [Validators.required, Validators.maxLength(3)]],
        billNo: ['', [Validators.required, Validators.maxLength(7)]],
        redemptionStatus:["R"],
        redemptionDate: [new Date(),[Validators.required] ],
        redemptionTotal: ['',Validators.required],
        redemptionInterest: ['',Validators.required ],
        billRedemSerial: ['', Validators.required],
        billRedemNo: ['', Validators.required],
        receivedinterest: ['',Validators.required],
        interestinmonths:[]
        
      });
    }
    //@ViewChild('myInput') myInputElement!: ElementRef;
    get redemptionInterest() {
      return this.bill.redemptionInterest;
    }
  
    get receivedinterest() {
      return this.bill.receivedinterest;
    }

    ngOnInit() {
      setTimeout(() => {
        this.myInput.nativeElement.focus(); // Focus on the input element
        
      }, 0);
      this.redeemform.valueChanges.subscribe((value) => {
        // Ensure the values are treated as numbers
        this.bill.redemptionInterest = Number(value.redemptionInterest || 0);
        this.bill.receivedinterest = Number(value.receivedinterest || 0);
      });
  
      // const storedData = localStorage.getItem('recentTransactionClicked');
      // console.log('Stored data from localStorage:', storedData);  // Log to check if data is available
    
      // if (storedData) {
      //   try {
      //     const parsedData = JSON.parse(storedData);  // Parse the data into an object
      //     console.log('Parsed data:', parsedData.bill); 
      //     this.billfound=true
      //     //this.bill=parsedData.bill
      //     this.billFetch(parsedData.bill.billNo,parsedData.bill.billSerial)
      //     this.cdr.detectChanges()

      //     this.redeemform.patchValue({
      //       billNo:parsedData.bill.billNo,
      //       billSerial:parsedData.bill.billSerial,
      //     })
      //     this.cdr.detectChanges()
      //     localStorage.removeItem('recentTransactionClicked');
      //     } catch (error) {
      //     console.error('Error parsing data from localStorage:', error);  // Catch any JSON parsing errors
      //   }
      // } else {
      //   console.warn('No transaction or transcript data found in localStorage');
      // }      
      // this.transcitionPatchValue()
      this.userService.getSettings().subscribe(
        list => {
            this.setting = list;   
            console.log('The list which I get:', list);
            
            // Check if list is valid and not empty
            if (list && list.length > 0) {
                this.redeemform.patchValue({
                    billRedemSerial: this.userService.getMySettingParamValueById("REDEM_CURRENT_SERIAL", list),
                    billSerial: this.userService.getMySettingParamValueById("CURRENT_SERIAL", list),
                });
            } else {
                console.warn('Settings list is empty or undefined');
            }
        },
        error => {
            console.error('Error fetching settings:', error);
        }
    );
    this.fetchNextBillNumbers();
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
  
    // console.log('Router state:', history.state); 
    // console.log('Data in PledgeComponent:', this.data); // Log the received data
  
    // this.data = history.state.data;
    // console.log('Data received in PledgeComponent:',  history.state.data);

    // if (this.data) {
    //   this.patchFormValues(history.state.data.data);
    // } else {
    //   console.error('No data received in PledgeComponent');
    // }


      console.log('redeem serial i get',this.userService.getMySettingParamValueById("REDEM_CURRENT_SERIAL",this.setting))



  }
  ngOnDestroy(): void {
    localStorage.removeItem('recentTransactionClicked');
  }
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey) {
      switch (event.key.toLowerCase()) {
        case 'r':
          event.preventDefault(); // Prevent browser refresh
          this.reset();
          break;
        case 's':
          event.preventDefault(); // Prevent any default "Save" action
          this.onRedemSubmit(this.redeemform.value);
          break;
        case 'p':
          event.preventDefault(); // Prevent browser print dialog
          this.onRedeemPrint();
          break;
      }
    }
  }
  
  formatDateToYYYYMMDD(date: Date): string {
    if (typeof date === 'string') {
      return date; // Return the string without modification
    }
  
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  getImageUrl(base64String: string, imageType = 'jpeg'): string {
    return `data:image/${imageType};base64,${base64String}`;
  }

  patchFormValues(data: any) {
    console.log('patch data :',data)
    console.log('patch data1 :',data.billnumber.bill_serial ,data.billnumber.bill_number)
    const a=data.billnumber.bill_number.replace(/\D/g, '');
    this.redeemform.patchValue({
      billSerial:data.billnumber.bill_serial,
      billNo:a

    })
    this.billFetch(this.redeemform.get('billNo')?.value,this.redeemform.get('billSerial')?.value)
    // billFetch
    localStorage.removeItem('responseDataVoice')

  }

    fetchNextBillNumbers() {
      this.userService.getNextRedeemNumber().subscribe(
        response => {
          this.nextBillRedemNo = response.nextBillRedemNo;
          this.redeemform.patchValue({
            billRedemNo: this.nextBillRedemNo
          });
        },
        error => {
          console.error('Error fetching next bill numbers:', error);
        }
      );
    } 
    roiCalculator(roi: number,amount:number){
      return (roi*amount)/1200
    }
    billFetch(billNo: number, billSerial: string) {
      const date =this.formatDateToYYYYMMDD(this.redeemform.get('redemptionDate')?.value)
      this.photoPreview = null;
      this.photoPreview1 = null;
      this.isPhoto = false;
      console.log('inbillfetch');
        
      this.userService.getBillByNumber(billNo,billSerial,date).subscribe(
        (resp) => {

          this.billfound=true
          this.bill = resp[0];
          if(this.userService.isMobileScreen()){
            this.fetchBillData(this.bill)
          }
          this.photoPreview1=this.getImageUrl(this.bill.billDetails[0].articlephoto)
          this.retrievePhoto(String(this.bill.customer.customerid))
          if(this.photoPreview==null){
            console.log('in photo by this')
            if(this.bill.customer.photo){
              const a=this.getImageUrl(this.bill.customer.photo)
              this.photoPreview=a
              this.cdr.detectChanges()
            }

            console.log('photo preview',this.photoPreview)
           
  
          }
          if(this.photoPreview==null){
            const a=this.getImageUrl(this.bill.customer.photo)
            if(this.bill.customer.photo){
              this.photoPreview=a
              this.cdr.detectChanges
            }
            else{
              this.photoPreview==null
            }
          }



          console.log(resp);
          
          this.redeemStatus=this.bill.redemptionStatus
          this.redeemform.patchValue({           
            redemptionInterest:this.bill.redemptionInterest,
            interestinmonths:this.bill.interestinmonths,
            receivedinterest:this.bill.receivedinterest,
            redemptionTotal:this.bill.amount+this.bill.redemptionInterest,
          })
          console.log('Response :',resp)
          //this.photoPreview=resp[0].customer.imagePath
          if (this.photoPreview){
            this.isPhoto=true
          }
          const customer: Customer = this.bill.customer;
          //customer.address = `${customer.street}, ${customer.district}, ${customer.country} - ${customer.pincode}`;
          customer.address = `${customer.address}`;
    
          console.log("Bill : " + this.bill);
          const a=this.redeemform.get("redemptionDate")?.value
          const startDate=this.formatDateToYYYYMMDD(a)
          console.log(startDate)
          const months=this.getMonthsBetweenDates(this.formatDateToYYYYMMDD(new Date (startDate)),this.formatDateToYYYYMMDD(new Date (resp[0].billDate)))
          const intrest =this.roiCalculator(resp[0].rateOfInterest,resp[0].amount)
          this.cdr.detectChanges()
        },
        (error) => {
          //this.redeemform;

          this.error = error;
          this.redeemform.patchValue({           
            redemptionInterest:'',
            interestinmonths:'',
            receivedinterest:'',
            redemptionTotal:'',
          })
          if (error.status === 404) {
            this.billfound=false
            this.redeemform.patchValue({           
              redemptionInterest:'',
              interestinmonths:'',
              receivedinterest:'',
              redemptionTotal:'',
            })
            console.log(error.message)
            this.snackBar.open('Bill not Found', 'Close', {  // Corrected here
              duration: 3000,
              verticalPosition: 'bottom',
            });
          } else {
            this.billfound=false
            this.redeemform.patchValue({           
              redemptionInterest:'',
              interestinmonths:'',
              receivedinterest:'',
              redemptionTotal:'',
            })
            //this.bill ='' ;
            console.error('Error fetching bill:', error);
            this.snackBar.open('Error fetching bill', 'Close', {
              duration: 3000,
              verticalPosition: 'bottom',
            });
          }
        }
      );
    }



        fetchBillData(bill: Bill): void {
          this.openCustomerCopyDialog(bill); // Open dialog with the fetched data
        }
      
        openCustomerCopyDialog(data: Bill): void {
          const dialogRef = this.dialog.open(ConfirmDialogComponent, {
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
    

        onFocusOut(event: FocusEvent): void {
          const currentTarget = event.target as HTMLElement;
          if (currentTarget !== document.activeElement) {
            console.log('Input lost focus:', currentTarget);
            this.onBillSelected();
          } else {
            console.log('Focus returned to the input, skipping onBillSelected');
          }
        }
        


    getMonthsBetweenDates(startDate: string, endDate: string): number {
      const start = new Date(startDate);
      const end = new Date(endDate);
    console.log('start=',start,'end=',end)
      const yearDifference = end.getFullYear() - start.getFullYear();
      const monthDifference = end.getMonth() - start.getMonth();
    
      console.log( 'Months=',yearDifference * 12 + monthDifference)
      return yearDifference * 12 + monthDifference;
    }
    transformDate(inputDate: string): string {
      // Create a new Date object from the input date string
      const date = new Date(inputDate);
      
      // Get the year, month, and day from the Date object
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const day = String(date.getDate()).padStart(2, '0');
  
      // Format the date as yyyy-mm-dd
      return `${year}-${month}-${day}`;
  }
  reset(){
    this.redeemform.patchValue({
      billNo:'',
      redemptionInterest:'',
      receivedinterest:'',
      redemptionTotal:''
    })
    this.billfound=false
    this.photoPreview=null
    this.photoPreview1=null
}




  
      onRedemSubmit(redeemform:any) {
        this.redeemform.patchValue({
          redemptionInterest:this.bill.redemptionInterest,
          receivedinterest:
          
          this.bill.receivedinterest
      
        })
        console.log('inside submit',this.redeemform.valid && this.redeemStatus!=this.redeemform.get('redemptionStatus')?.value,this.redeemform.valid , this.redeemStatus)
        if (this.redeemform.valid && this.redeemStatus!=this.redeemform.get('redemptionStatus')?.value) {
          console.log('Form submitted');
          console.log(this.redeemform.value);
          const date=this.transformDate(this.redeemform.get('redemptionDate')?.value)
          console.log(date)
          this.redeemform.patchValue({
            redemptionDate:date
          })
          
    
          const id = this.bill?.billSequence;    
  
          if (id !== undefined) {
          //const updateUrl = `http://localhost:8080/jewelbankersapi/bills/${id}`;
          this.userService.updateRedeemedBill(id, this.redeemform.value).subscribe(
            (response) =>{
              console.log('Updated successfully:', response);

              if(this.redeemform.get('redemptionStatus')?.value=='R'){
                if(this.userService.getUserByIdForWhatsapp()){
                  this.message(response)
               }
             
                this.addToLocalStorageArray({bill:this.bill,type:'redeemed'})
                this.appcomp.loadTransactions() 
                this.snackBar.open(`Succesfully Redeemed bill`, 'Close', { 
                  duration: 3000,
                  verticalPosition: 'bottom',
                });
              }
              else if(this.redeemform.get('redemptionStatus')?.value=='O'){
                this.addToLocalStorageArray({bill:this.bill,type:'opened'})
                this.appcomp.loadTransactions() 
                this.snackBar.open(`Succesfully Opened bill`, 'Close', { 
                  duration: 3000,
                  verticalPosition: 'bottom',
                });
  
              }
              else if(this.redeemform.get('redemptionStatus')?.value=='C'){
                this.addToLocalStorageArray({bill:this.bill,type:'canceled'})
                this.appcomp.loadTransactions() 
                this.snackBar.open(`Succesfully Cancelled bill`, 'Close', { 
                  duration: 3000,
                  verticalPosition: 'bottom',
                });
              }
  
              this.redeemform.patchValue({
                //billSerial:'',
                billNo:'',
              });
              // if(this.redeemform.get('redemptionStatus')?.value=='R'){
              //   const dialogRef = this.dialog.open(RedeemCopyComponent, {
              //     width: '200px',
              //   });
              
              //   dialogRef.afterClosed().subscribe(result => {
              //    // this.officecopy = result; // Save the result from the dialog
              //     //console.log('dialogue reply', this.officecopy); // Log the result
              
              //     // if (result) {
              //     //   // Execute print logic if 'Yes' is selected
              //     //   this.generateAndDownloadPDF();
              //     //   // Add your print logic here
              //     // } else {
              //     //   console.log('Print canceled.'); // Logic for 'No' can be handled here
              //     // }
              //   });
    
              // }
  
              // After successful update, generate and download the PDF
              this.reset()
              this.fetchNextBillNumbers()
            },
            (error) => {
              console.error('Error updating bill:', error);
              if(this.redeemform.get('redemptionStatus')?.value=='R'){
                this.snackBar.open(`Error Redeeming bill`, 'Close', { 
                  duration: 3000,
                  verticalPosition: 'bottom',
                });
              }
              else if(this.redeemform.get('redemptionStatus')?.value=='O'){
                this.snackBar.open(`Error Opening bill`, 'Close', { 
                  duration: 3000,
                  verticalPosition: 'bottom',
                });
  
              }
              else if(this.redeemform.get('redemptionStatus')?.value=='C'){
                this.snackBar.open(`Error Cancelling bill`, 'Close', { 
                  duration: 3000,
                  verticalPosition: 'bottom',
                });
              }
              this.fetchNextBillNumbers() 
            }
          );
        } else {
          console.error('Bill sequence ID is undefined');
        this.snackBar.open('Error: Bill sequence is missing', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
        });
        this.fetchNextBillNumbers()
        }
       }
       else{
  
        this.snackBar.open('Check the values ', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
        });
  
       }
       this.myInput.nativeElement.focus();
  
    }

    generateAndDownloadPDF() {
      const billSequence = this.bill?.billSequence; // Use the safe navigation operator to prevent undefined access
      const token = sessionStorage.getItem('accessToken');
    
      if (billSequence === undefined) {
        this.snackBar.open('Bill sequence is invalid', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
        });
        return;
      }
    
      //const url = `http://localhost:8080/jewelbankersapi/bills/redeempdf/${billSequence}`;
      console.log("billSequence: " + billSequence);
      this.userService.downloadCustomerCopyPDF(billSequence).subscribe(
        (response: Blob) => {
          console.log('PDF Blob received:', response);
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
            iframe.contentWindow?.focus();
      
            // Check if contentDocument is available
            const contentDoc = iframe.contentDocument;
            if (contentDoc) {
              // Add custom styles to set paper size and scaling (A5 paper and fitting content)
              const style = contentDoc.createElement('style');
              style.innerHTML = `
                @page {
                  size: A5; /* Set paper size to A5 */
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
      
          // You can remove the iframe after printing manually if needed, but leave it for now to ensure print dialog shows.
        },
        error => {
          console.error('Error downloading the file for Customer copy', error);
          this.snackBar.open('Error generating Customer Copy', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
          });
        }
      );
                        
}
  

    onBillSelected() {
      console.log('onBillSelected called');

      const billNo = this.redeemform.get("billNo")?.value;
      const billSerial = this.redeemform.get("billSerial")?.value;
      

      this.billFetch(billNo,billSerial)

    }
    undoRedemption(){
      const billNo = this.redeemform.get("billNo")?.value;
      const billSerial = this.redeemform.get("billSerial")?.value;
      this.userService.deleteRedeemedBill(billSerial,billNo).subscribe((resp:any)=>{
        this.snackBar.open(resp, 'Close', {  // Corrected here
          duration: 3000,
          verticalPosition: 'bottom',

      })
      }
      )}

    saveRedemptionBill(bill: Bill) { 
      const body=JSON.stringify(bill);
      const headers  = new HttpHeaders({ 'Content-Type': 'application/json'})
      this.userService.saveRedemptionBill(bill).subscribe(
        (resp) => {
        },
        (error) => {
          console.error('Error fetching data:', error);
        }
      );
 }
 getProductDescriptions(billDetails: BillDetail[]): string {
  let descriptions = '';

  for (const billDetail of billDetails) {
    descriptions += billDetail.productDescription + ' '; // Append each description with a space
  }

  return descriptions.trim(); // Trim any extra space at the end
}
      

 async retrievePhoto(customerId: string): Promise<void> {
  if (customerId) {
    console.log('Retrieving photo for customer ID:', customerId);

    try {
      // Attempt to get the photo from IndexedDB
      const photoData = await this.indexedDbService.getPhoto(customerId);
      console.log('Retrieved photo data:', photoData);

      if (photoData) {
        this.displayPhoto(photoData.photo); // Display the photo if found
      } else {
        //alert('No photo found for the given customer ID.');
      }
    } catch (error) {
      console.error('Error retrieving photo:', error);
      //alert('Failed to retrieve the photo. Please try again.');
    }
  } else {
    //alert('Please provide a valid customer ID.');
  }
}

// Display the photo in the UI
displayPhoto(photoBlob: Blob): void {
  this.isPhoto=true
  const url = URL.createObjectURL(photoBlob); // Create a URL for the Blob
  this.photoPreview = url; // Set the URL to the photoPreview variable
}
message(savedBill:Bill){
  let shop_name
  this.userService.getSettings().subscribe((resp:any)=>{
    shop_name=this.userService.getMySettingParamValueById('SHOP_NAME',resp)
  })
  console.log('messgae sending')
  if(shop_name){
    this.userService.whatsappRedeem(savedBill,shop_name).pipe(
      catchError((error) => {
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



onRedeemPrint(){
  this.redeemform.patchValue({
    redemptionInterest:this.bill.redemptionInterest,
    receivedinterest:this.bill.receivedinterest

  })
  console.log('inside submit',this.redeemform.valid && this.redeemStatus!=this.redeemform.get('redemptionStatus')?.value,this.redeemform.valid , this.redeemStatus)
  if (this.redeemform.valid && this.redeemStatus!=this.redeemform.get('redemptionStatus')?.value) {
    console.log('Form submitted');
    console.log(this.redeemform.value);
    const date=this.transformDate(this.redeemform.get('redemptionDate')?.value)
    console.log(date)
    this.redeemform.patchValue({
      redemptionDate:date
      
    })
    

    const id = this.bill?.billSequence;    

    if (id !== undefined) {

    //const updateUrl = `http://localhost:8080/jewelbankersapi/bills/${id}`;
    this.userService.updateRedeemedBill(id, this.redeemform.value).subscribe(
      (response) =>{
        console.log('Updated successfully:', response);
        if(this.redeemform.get('redemptionStatus')?.value=='R'){
          if(this.userService.getUserByIdForWhatsapp()){
            this.message(response)
         }
          this.snackBar.open(`Succesfully Redeemed bill`, 'Close', { 
            duration: 3000,
            verticalPosition: 'bottom',
          });
        }
        else if(this.redeemform.get('redemptionStatus')?.value=='O'){
          this.snackBar.open(`Succesfully Opened bill`, 'Close', { 
            duration: 3000,
            verticalPosition: 'bottom',
          });

        }
        else if(this.redeemform.get('redemptionStatus')?.value=='C'){
          this.snackBar.open(`Succesfully Cancelled bill`, 'Close', { 
            duration: 3000,
            verticalPosition: 'bottom',
          });
        }

        this.redeemform.patchValue({
         // billSerial:'',
          billNo:'',
        });
        if(this.redeemform.get('redemptionStatus')?.value=='R'){
          this.generateAndDownloadPDF();
        }
        console.log(".............................. tis is what goes ",this.bill)

        this.reset()
        this.fetchNextBillNumbers()

      },
      (error) => {
        console.error('Error updating bill:', error);
        if(this.redeemform.get('redemptionStatus')?.value=='R'){
          this.snackBar.open(`Error Redeeming bill`, 'Close', { 
            duration: 3000,
            verticalPosition: 'bottom',
          });
        }
        else if(this.redeemform.get('redemptionStatus')?.value=='O'){
          this.snackBar.open(`Error Opening bill`, 'Close', { 
            duration: 3000,
            verticalPosition: 'bottom',
          });

        }
        else if(this.redeemform.get('redemptionStatus')?.value=='C'){
          this.snackBar.open(`Error Cancelling bill`, 'Close', { 
            duration: 3000,
            verticalPosition: 'bottom',
          });
        }
        this.fetchNextBillNumbers() 
      }
    );
  } else {
    console.error('Bill sequence ID is undefined');
  this.snackBar.open('Error: Bill sequence is missing', 'Close', {
    duration: 3000,
    verticalPosition: 'bottom',
  });
  this.fetchNextBillNumbers()
  }
 }
 else{

  this.snackBar.open('Check the values ', 'Close', {
    duration: 3000,
    verticalPosition: 'bottom',
  });

 }

 this.myInput.nativeElement.focus();
  
}
addToLocalStorageArray(newItem: any) {
  console.log('.......................this value loaded ',newItem)
  const storedArray: any[] = JSON.parse(localStorage.getItem('billDataArray') || '[]');

  storedArray.push(newItem);

try{


  localStorage.setItem('billDataArray', JSON.stringify(storedArray));
}
          catch (error) {
  this.userService.handleStorageError(error);
}
  console.log('Updated Array:', storedArray); // Debugging
}     


  // setRedeemption() {
  //   const bill: any = {
  //     redemptionDate: this.redeemform.get('redemptionDate')?.value != null?this.redeemform.get('redemptionDate')?.value:null,
  //     redemptionInterest: parseInt(this.redeemform.get('redemptionInterest')?.value),
  //     redemptionTotal: parseInt(this.redeemform.get('redemptionTotal')?.value),
  //     redemptionStatus: this.redeemform.get('redemptionStatus')?.value != null?this.redeemform.get('redemptionStatus')?.value:null,
  //     billRedemSerial: this.redeemform.get('billRedemSerial')?.value != null?this.redeemform.get('billRedemSerial')?.value:null,
  //     billRedemNo: this.nextBillRedemNo,
  //    }
  //    return bill;
  // }
}