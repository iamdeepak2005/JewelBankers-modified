import { Component, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DOCUMENT } from '@angular/common';
import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './auth.service';
import {CdkDrag} from '@angular/cdk/drag-drop';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { UserService } from './user.service';
import { MatDialog } from '@angular/material/dialog';
import { WarningDialogComponent } from './warning-dialog/warning-dialog.component';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { loaderInterceptor } from './loader.interceptor';
import { LoaderComponent } from "./loader/loader.component";
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BehaviorSubject, timer } from 'rxjs';
import { RatesCardComponent } from "../rates-card/rates-card.component";
import { Item } from './jewellery-stock-additon/stock';
import { JewellerItemStockingService } from './jeweller-item-stocking.service';
import { error } from 'console';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatLabel } from '@angular/material/form-field';
import { Videoomponent } from './video/video.component';
import { MatIconModule } from '@angular/material/icon';
import { AiComposerComponent } from './common/ai-composer/ai-composer.component';
declare let webkitSpeechRecognition: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,MatLabel, CdkDrag, CommonModule, NgxSpinnerModule, LoaderComponent, RatesCardComponent,FormsModule,MatIconModule, AiComposerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px) scale(0.95) rotate(-5deg)' }),
        animate(
          '500ms cubic-bezier(0.25, 1, 0.5, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1) rotate(0)' })
        )
      ]),
      transition(':leave', [
        animate(
          '300ms ease-in',
          style({ opacity: 0, transform: 'translateY(20px) scale(0.95) rotate(5deg)' })
        )
      ])
    ])
  ],

  
})


export class AppComponent {
  gold_rate:any
  silver_rate:any
  AI:Boolean=true
  title = 'jewel';
  transactionBox:any
  baseUrl: string | undefined;
  transcript = '';
  interimTranscript = '';
  recognition: any;
  response: any;
  inactivityTimeout: any;
  isLoading = false;
  authenticated: boolean=false;

  constructor(private spinner: NgxSpinnerService,private authService:AuthService,public dialog: MatDialog,private http: HttpClient,private router:Router,private userService:UserService,private jewelleryItemStocking:JewellerItemStockingService,private snackBar:MatSnackBar){

  }
  isListening:boolean = false;
  daysLeft:any
  isNotAuthenticated:boolean=true
  transactions: any[] = [];
  settings:any
  a:any
  barcodeValue: string = '';
  tempBarcode: string = '';
  timeout: any;
  isWarning:boolean=false
  showElement: boolean = false;
  private itemsSubject = new BehaviorSubject<Item[]>([]);
  items$ = this.itemsSubject.asObservable();

  // Getter for current items
  get items(): Item[] {
    return this.itemsSubject.getValue();
  }
  set items(newItems: Item[]) {
    this.itemsSubject.next(newItems); 
  }
   ngOnInit(): void {
    

    if (sessionStorage.getItem('accessToken')) {
      this.authenticated = true;
    }
    const ounce=31.1035
    const inr_rate_url="https://api.exchangerate-api.com/v4/latest/USD"

    let usd_inr=0
    this.http.get(inr_rate_url).subscribe((resp: any) => {
      console.log("from the inr api .......",resp.rates.INR)
      usd_inr=resp.rates.INR
    });

    const gold_url=`https://api.gold-api.com/price/XAU`
    this.http.get(gold_url).subscribe((resp: any) => {
      console.log("from the gold api .......",(resp.price/ounce)*usd_inr)
      this.gold_rate=((resp.price/ounce)*usd_inr).toFixed(2)
      try{
        localStorage.setItem('gold',this.gold_rate)
      }
      catch (error) {
    this.userService.handleStorageError(error);
}
    });
    const silver_url=`https://api.gold-api.com/price/XAG`
    this.http.get(silver_url).subscribe((resp: any) => {
      console.log("from the silver api .......",(resp.price/ounce)*usd_inr)
      this.silver_rate=(((resp.price/ounce)*usd_inr)+10).toFixed(2)
    try{
        localStorage.setItem('silver',this.silver_rate)
    }
            catch (error) {
    this.userService.handleStorageError(error);
}

    });
    const SpeechRecognition = (window as any).SpeechRecognition || webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
  
    this.recognition.onresult = (event: any) => {
      this.interimTranscript = '';
      let shouldStop = false;
  
      // Loop through all results
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          // Final transcription is captured here
          const finalTranscript = event.results[i][0].transcript;
          this.transcript += finalTranscript + ' ';
  
          if (finalTranscript.toLowerCase().includes("that's it") || finalTranscript.toLowerCase().includes("stop")) {
            shouldStop = true;
          }
        } else {
          // Interim transcription
          this.interimTranscript += event.results[i][0].transcript;
        }
      }
  
      if (shouldStop) {
        // If the stop command is detected, stop listening and send the transcript
        this.stopListening();
        this.sendTranscriptToServer(this.transcript);  // Send final transcript
        this.transcript = '';  // Reset transcript after sending
      }
    };
  
    this.recognition.onerror = (event: any) => {
      console.error(event.error);
      this.isListening = false;
      this.isLoading = false;
      this.snackBar.open('Please Speak Properly', 'Close', {
        duration: 3000,
        verticalPosition: 'bottom',
      });
    };
  
    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition.start(); // Restart recognition if listening is still active
      }
      this.isLoading = false;
    };

    this.scheduleSilverPriceCheck();
    this.scheduleGoldPriceCheck();
    this.baseUrl = window.location.origin;
    console.log('Base URL:', this.baseUrl);
    this.spinner.show(); 

    console.log('see this ......................')
    // Optional: Hide spinner after a default timeout (e.g., 1.5s) for initial load
    setTimeout(() => {
      this.spinner.hide();
    }, 1500);

    }
  addTransaction(newTransaction: any): void {
    this.transactions.unshift(newTransaction); // Add the new transaction to the top of the list.
  }
  toggleListening(): void {
    if (this.isListening) {
      this.stopListening();
      this.sendTranscriptToServer(this.transcript);  // Send the transcript after stopping
      this.transcript = '';  // Clear the transcript after sending
    } else {
      this.startListening();
    }
  }
    openCamera() {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
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
              this.handleFile(file)
  
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
  
  
  
    // Handle the selected file
    
    handleFile(file: File) {
      // let customerNames: string[] = []; // Explicitly defining the type as string[]
      // this.userService.getCustomersByNameAI('').subscribe((resp: any[]) => {
      //   // Create an array of all customer names
      //   customerNames = resp.map((customer: any) => customer.customerName);
      //   console.log(customerNames);
      // });
      
      // console.log('Token:', customerNames);
      
      // Create a FormData object to prepare the data for the POST request
      const formData = new FormData();
  
      // Append the file to the FormData object
      formData.append('file', file);  // 'file' is the file object that you want to upload
      
      // Get the token from sessionStorage
      const token = sessionStorage.getItem('accessToken');
      
      // Append the token to the FormData object
      if (token) {
        formData.append('token', token);  // Append the token to the FormData object
    }    
      // Check if customerNames is not empty before appending it
      // if (customerNames && customerNames.length > 0) {
      //   formData.append('customer_names', JSON.stringify(customerNames)); // Convert array to string
      // } else {
      //   console.error('Customer names are undefined or empty');
      // }
      
      // console.log('FormData contents:');
      // // Log FormData contents for debugging
      // // Note: For debugging, FormData is not directly iterable in browsers, so we can log it manually
      // formData.forEach((value, key) => {
      //   console.log(key, value);
      // });
      
      // Make the HTTP POST request to upload the image
      this.http.post(this.userService.pythonURL + `/image`, formData).subscribe({
        next: (response: any) => {
          // Store the response data in localStorage
          
          try{localStorage.setItem('responseData', JSON.stringify(response));
          }
          catch (error) {
  this.userService.handleStorageError(error);
}
          console.log('Image upload response:', response);
      
          // Handle navigation based on the 'need' type in the response
          if (response.need) {
            switch (response.need) {
              case 'pledge':
                this.router.navigate(['/pledge'], { state: { data: response } });
                break;
              case 'redeem':
                this.router.navigate(['/redeem'], { state: { data: response } });
                break;
              case 'search':
                this.router.navigate(['/search'], { state: { data: response } });
                break;
              default:
                console.error('Invalid need type:', response.need);
                break;
            }
          } else {
            console.error('Response does not contain "need" field:', response);
          }
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          this.snackBar.open('Please Place The bill properly in the Camera', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
          });
        }
      });
    }      
        parseJsonString(jsonString: string): any {
      const result: any = {
        need: null,
        customer_name: null,
        weight: null,
        article: null,
        amount: null,
        item_description: null,
        billnumber: {
          bill_serial: null,
          bill_number: null,
        },
        print_details: null,
      };
  
      try {
        // Parse JSON string into JavaScript object
        const jsonObject = JSON.parse(jsonString);
  
        // Extract fields using optional chaining and default values
        result.need = jsonObject.need ?? null;
        result.customer_name = jsonObject.customer_name ?? null;
        result.weight = jsonObject.weight ?? null;
        result.article = jsonObject.article ?? null;
        result.amount = jsonObject.amount ?? null;
        result.item_description = jsonObject.item_description ?? null;
        result.print_details = jsonObject.print_details ?? null;
  
        // Handle billnumber separately
        if (jsonObject.billnumber) {
          result.billnumber.bill_serial = jsonObject.billnumber.bill_serial ?? null;
          result.billnumber.bill_number = jsonObject.billnumber.bill_number ?? null;
        }
  
      } catch (error) {
        console.error('Invalid JSON format:', error);
      }
      console.log(result)
      this.handleResponse(result) ;
    }
    info(item:any){
      console.log(item)
      const videoData = {
        videoPath: item // Assuming 'item' has a 'video' attribute with the video path
      };
  
      const dialogRef = this.dialog.open(Videoomponent, {
        width: '90%',
        height: '85%',
        data: videoData
      });
    }
  
  

  startListening(): void {
    this.isListening = true;
    this.isLoading = true;
    this.recognition.start();
  }

  stopListening(): void {
    this.recognition.stop();
    this.isListening = false;
    this.isLoading = false;
  }

  isLoggedIn(){
    return this.authService.isLogin()
  }
  setVisibilityForFirstComponent(isFirstComponent: boolean): void {
    this.showElement = isFirstComponent;
  }

  loadTransactions(): void {
    // Retrieve the data from localStorage
    const storedArray = JSON.parse(localStorage.getItem('billDataArray') || '[]');
    this.transactions = storedArray;
  }
  scheduleGoldPriceCheck(): void {
    // Check every minute whether it's time to call the API
    const checkTimeInterval = 60 * 1000; // 1 minute
    const targetTimes = [9, 17]; // Hours to trigger: 9 AM and 5 PM (24-hour format)

    timer(0, checkTimeInterval).subscribe(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Execute API only at 9:00 AM or 5:00 PM
      if (targetTimes.includes(currentHour) && currentMinute === 0) {
        console.log('Triggering Gold Price API:', now);
        this.getGoldPrice();
      }
    });
  }
  scheduleSilverPriceCheck(): void {
    // Check every minute whether it's time to call the API
    const checkTimeInterval = 60 * 1000; // 1 minute
    const targetTimes = [9, 17]; // Hours to trigger: 9 AM and 5 PM (24-hour format)

    timer(0, checkTimeInterval).subscribe(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Execute API only at 9:00 AM or 5:00 PM
      if (targetTimes.includes(currentHour) && currentMinute === 0) {
        console.log('Triggering Gold Price API:', now);
        this.getSilverPrice();
      }
    });
  }
  sendTranscriptToServer(transcript: string): void {
    const token = sessionStorage.getItem('accessToken');
    let customerNames: string[] = [];
  
    this.userService.getCustomersByNameAI('').subscribe((resp: any[]) => {
      this.transcript=' '
      // Step 2: Map customer names
      const customerNames = resp.map((customer: any) => customer.customerName);

      // Step 3: Create the request body
      const requestBody = {
        input: transcript,
        token: sessionStorage.getItem('accessToken'),
      };

      // Step 4: Compress the request body using Gzip
      //const compressedBody = this.compressData(requestBody);

      // Step 5: Send the compressed request to the backend
      this.http.post(`${this.userService.pythonURL}/customer`, requestBody, {
      }).subscribe({
        next: (response) => {
          console.log('API called, response received:', response);
          this.handleResponse(response);
        },
        error: (error) => {
          console.error('Error occurred while sending transcript:', error);
          this.snackBar.open('Please Speak Properly', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
          });
        }
      });
    });
    }
    
    handleResponse(response: any) {
      this.response = response;
      console.log("in handling", response.data);
    
      const { need } = response.data;
      try{localStorage.setItem('responseDataVoice', JSON.stringify(response.data));}
              catch (error) {
  this.userService.handleStorageError(error);
}
      const currentUrl = this.router.url;  // Get the current URL
      const targetUrl = `/${need}`; // Construct the target URL (e.g., "/pledge", "/redeem", "/search")
    
      if (currentUrl === targetUrl) {
        // If the user is already on the target page, reload the page after 3 seconds
        setTimeout(() => {
          location.reload();  // Reload the page
        }, 3000);
      } else {
        // Otherwise, navigate to the target page
        this.router.navigate([targetUrl]);
      }
    }
    



  getGoldPrice(): void {
    this.userService.getGoldPrice().subscribe(
      (resp: any) => {
        console.log('Gold Price Data:', resp);
        try{
        localStorage.setItem('gold',JSON.stringify(resp))
      }          catch (error) {
  this.userService.handleStorageError(error);
}
      },
      (error) => {
        console.error('Error fetching gold price:', error);
      }
    );
  }
  getSilverPrice(): void {
    this.userService.getSilverPrice().subscribe(
      (resp: any) => {
        console.log('Gold Price Data:', resp);
        try{
        localStorage.setItem('silver',JSON.stringify(resp))
        }
                  catch (error) {
  this.userService.handleStorageError(error);
}
      },
      (error) => {
        console.error('Error fetching gold price:', error);
      }
    );
  }


  pledge(transaction: any): void {
    this.navigateWithTransaction(transaction, 'pledge');
  }

  redeem(transaction: any): void {
    this.navigateWithTransaction(transaction, 'redeem');
  }
  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (this.timeout) {
      clearTimeout(this.timeout);  // Clear the previous timeout if there was one
    }

    // Append the key pressed to the temporary barcode string
    this.tempBarcode += event.key;

    // Wait for 300ms to consider it as a completed scan (final character entered)
    // this.timeout = setTimeout(() => {
    //   // Process the barcode value after the scan is completed
    //   this.barcodeValue = this.tempBarcode;
    //   this.tempBarcode = '';  // Reset the tempBarcode for the next scan

    //   // Send the barcode value to the backend
    //   this.userService.sendBarcodeToBackend(this.barcodeValue).subscribe(
    //     (response: Item) => {
    //       this.addItemToStock(response);
    //     },
    //     (error) => {
    //       console.log('Error fetching barcode data:', error);

    //       const fallbackItem: Item ={
    //         itemname: "Gold Necklace",
    //         qty: 1,
    //         grossWt: 20.5,
    //         stoneweight: 2.0,
    //         netWt: 18.5,
    //         purity: 22,
    //         rate: 5500,
    //         amount: 101750,
    //         wastagepercent: 5,
    //         totalamount: 106837.5 // Example calculation
    //       };
    //       //this.addItemToStock(fallbackItem);
    //     }
    //   );
    // }, 300); 
  }

  // Helper method to add the item to the stock
  addItemToStock(item: Item): void {
    // Assuming `this.jewelleryItemStocking.addItem()` adds the item to your data source
    this.jewelleryItemStocking.addItem(item);
  }
  

  private navigateWithTransaction(transaction: any, type: string): void {
    this.router.navigate([`/${type}`]);
  }
  
  handleTransactionClick(transaction: any): void {
    // Check if localStorage already has a recent transaction before setting it again
    const existingTransaction = localStorage.getItem('recentTransactionClicked');
    if (!existingTransaction) {
      // Only set the transaction in localStorage if it doesn't exist yet
      try{
      localStorage.setItem('recentTransactionClicked', JSON.stringify(transaction));
      
    }
              catch (error) {
  this.userService.handleStorageError(error);
}
    }
  
    switch (transaction.type) {
      case 'pledged':
        this.pledge(transaction);
        break;
      case 'redeemed':
        this.redeem(transaction);
        break;
      case 'opened':
        this.redeem(transaction);
        break;
      case 'canceled':
        this.redeem(transaction);
        break;
      case 'updated':
        this.pledge(transaction);
        break;
      default:
        console.log('Transaction clicked:', transaction);
        break;
    }
  }
    
  getTransactionLabel(type: string): string {
    const labels: { [key: string]: string } = {
      pledged: 'Pledged',
      redeemed: 'Redeemed',
      updated: 'Updated',
      opened: 'Opened',
      canceled: 'Canceled',
    };
    return labels[type] || 'Unknown';
  }
  

}

function openDialog() {
  throw new Error('Function not implemented.');
}



