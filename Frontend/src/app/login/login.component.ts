import { Component, ElementRef, ViewChild, AfterViewInit, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {  HttpHeaders } from '@angular/common/http';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddsComponent } from "../adds/adds.component";
import { MatDialog } from '@angular/material/dialog';
import { Videoomponent } from '../video/video.component';
import { UserService } from '../user.service';
import { gzip  } from 'pako';
import { MatLabel } from '@angular/material/form-field';

declare let webkitSpeechRecognition: any;
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, HeaderComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit, OnInit {
  isListening = false;
  transcript = '';
  interimTranscript = '';
  recognition: any;
  response: any;
  inactivityTimeout: any;
  isLoading = false;
  autoSlideInterval: any;
  activeIndex = 0;
  baseUrl: any;
  constructor(private router: Router,private userService:UserService,@Inject(DOCUMENT) private document: Document, private dialog: MatDialog,private http: HttpClient,private authService: AuthService,private snackBar:MatSnackBar){


  }
  @ViewChild('nextButton', { static: true }) nextButton!: ElementRef;
  @ViewChild('prevButton', { static: true }) prevButton!: ElementRef;
  @ViewChild('slide', { static: true }) slide!: ElementRef;

  items = [
    { name: 'Saraswathi Jewelers', description: 'Discover elegance at Saraswati Jewellers by SURESH KAG, for premium chains, stylish rings, and elegant earrings. Contact us at 9566102031 for more details.', image: 'SSJ.jpg',videoPath:"SSJ.mp4" },
    { name: 'TATA AIA Insurance', description: 'Explore comprehensive coverage with Tata AIA by MAHESH KAG, offering Car, Two Wheeler, Health, Travel, and Home Insurance tailored to meet your needs. For more information, contact us at 9940543805.', image: 'TATA_AIG.jpg',videoPath:"TATA AIA.mp4" },
    { name: 'Day Nyt Slots', description: 'DNS offers a spacious turf for cricket and football from 6 AM to 12 AM daily. For details, call 9003054272.', image: 'DNS.jpg',videoPath:"DNS.mp4" },
    { name: 'DFUSE', description: 'THE GENTLEMENS THEORY A Curated Label by @dilip_choyal Specializing in Sharp Menswear . ATELIER | CLOTHING | COUTURIER. For details, call 9791112797', image: 'DFUSE.jpg',videoPath:"DFUSE.mp4" },
    { name: 'MDR Tech Solutions', description: 'We develop custom software to meet all business needs across various industries by ROSHAN KAG and DEEPAK KAG. For more information, if you are interested in joining our team, message us on WhatsApp at 9444338872.', image: 'tri.jpg',videoPath:"tri.mp4" }
  ];

  ngAfterViewInit() {
    this.nextButton.nativeElement.addEventListener('click', () => {
      this.onNextClick();
      this.restartAutoSlide();
    });
    this.prevButton.nativeElement.addEventListener('click', () => {
      this.onPrevClick();
      this.restartAutoSlide();
    });
    this.setActiveItem();
    this.startAutoSlide(); // Start the automatic sliding
  }

  onNextClick() {
    const items = this.slide.nativeElement.querySelectorAll('.item');
    this.activeIndex = (this.activeIndex + 1) % items.length;
    this.slide.nativeElement.appendChild(items[0]);
    this.setActiveItem();
  }

  onPrevClick() {
    const items = this.slide.nativeElement.querySelectorAll('.item');
    this.activeIndex = (this.activeIndex - 1 + items.length) % items.length;
    this.slide.nativeElement.prepend(items[items.length - 1]);
    this.setActiveItem();
  }

  setActiveItem() {
    const items = this.slide.nativeElement.querySelectorAll('.item');
    items.forEach((item: any) => item.classList.remove('active'));
    items[this.activeIndex].classList.add('active');
  }

  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      this.onNextClick();
    }, 8000); // Slide every 4 seconds
  }

  restartAutoSlide() {
    clearInterval(this.autoSlideInterval);
    this.startAutoSlide();
  }

  ngOnDestroy() {
    clearInterval(this.autoSlideInterval); // Clear the interval when the component is destroyed
  }
  ngOnInit(): void {

  
    this.baseUrl = window.location.origin;
  
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

  private getToken(): string {
    return localStorage.getItem('token') || '';
  }
  // compressData(data: any): Uint8Array {
  //   return gzip(JSON.stringify(data));  // Use Gzip compression
  // }

  sendTranscriptToServer(transcript: string): void {
    const token = sessionStorage.getItem('accessToken');
    let customerNames: string[] = [];
  
    this.userService.getCustomersByNameAI('').subscribe((resp: any[]) => {
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

    console.log("in handling",response.data)
    const { need } = response.data;
    localStorage.setItem('responseDataVoice',JSON.stringify(response.data))
    
    switch (need) {
      case 'pledge':
        this.router.navigate(['/pledge'],);
        break;
      case 'redeem':
        this.router.navigate(['/redeem']);
        break;
      case 'search':
        this.router.navigate(['/search']);
        break;
      default:
        console.error('Invalid need type');
        break;
    }
  }
  // openCamera() {
  //   // Create a video element to stream the camera feed
  //   const video = document.createElement('video');
  //   video.style.position = 'absolute';
  //   video.style.top = '50%';
  //   video.style.left = '50%';
  //   video.style.transform = 'translate(-50%, -50%)';
  //   video.style.width = '50%';
  //   video.style.height = 'auto';
  //   video.style.zIndex = '999'; // Make sure it's on top of other elements
  //   video.style.borderRadius='20px';
  //   video.style.border='2px #333 solid'
  
  //   // Create a canvas element to capture the image
  //   const canvas = document.createElement('canvas');
  //   canvas.style.display = 'none'; // Hide the canvas element
  
  //   // Create a button to capture the photo
  //   const captureButton = document.createElement('button');
  //   captureButton.innerHTML = `
  //   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //     <path d="M21 3H3C1.89 3 1 3.89 1 5V19C1 20.11 1.89 21 3 21H21C22.11 21 23 20.11 23 19V5C23 3.89 22.11 3 21 3ZM21 19H3V5H21V19ZM12 8L16 12H13V14H11V12H8L12 8Z" fill="white"/>
  //   </svg>
  // `; 
  //   captureButton.style.position = 'absolute';
  //   captureButton.style.bottom = '40px';
  //   captureButton.style.left = '50%';
  //   captureButton.style.transform = 'translateX(-50%)';
  //   captureButton.style.padding = '10px 20px';
  //   captureButton.style.backgroundColor = '#333';
  //   captureButton.style.color = '#ffffff';
  //   captureButton.style.border = 'none';
  //   captureButton.style.borderRadius = '5px';
  //   captureButton.style.cursor = 'pointer';
  //   captureButton.style.zIndex = '1000'; // Make sure it's on top of other elements
  //   captureButton.style.marginTop='20px'
  //   captureButton.style.fontFamily='cursive'
  
  //   // Append the video and capture button to the document body
  //   document.body.appendChild(video);
  //   document.body.appendChild(captureButton);
  
  //   // Get access to the camera
  //   navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
  //     .then((stream) => {
  //       // Set the video source to the camera stream
  //       video.srcObject = stream;
  //       video.play();
  
  //       // Once the video metadata is loaded
  //       video.onloadedmetadata = () => {
  //         // Show the video element
  //         video.style.display = 'block';
  
  //         // Set up the capture button click event
  //         captureButton.addEventListener('click', () => {
  //           // Create a canvas context
  //           const context = canvas.getContext('2d');
  //           if (!context) {
  //             console.error('Failed to get canvas context.');
  //             return;
  //           }
  
  //           // Set the canvas dimensions to match the video dimensions
  //           canvas.width = video.videoWidth;
  //           canvas.height = video.videoHeight;
  
  //           // Draw the video frame to the canvas
  //           context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  //           // Convert the canvas to a blob
  //           canvas.toBlob((blob) => {
  //             if (blob) {
  //               // Create a File object from the Blob
  //               const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  //               this.handleFile(file);
  //             }
  //           }, 'image/jpeg');
  
  //           // Stop the camera stream
  //           stream.getTracks().forEach(track => track.stop());
  
  //           // Remove the video element and capture button
  //           video.remove();
  //           captureButton.remove();
  //         });
  //       };
  //     })
  //     .catch((error) => {
  //       console.error('Error accessing camera:', error);
  //     });
  // }
    
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
        localStorage.setItem('responseData', JSON.stringify(response));
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
    
  }


    

  
  
