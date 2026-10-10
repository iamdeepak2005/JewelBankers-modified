import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '../user.service';

@Component({
  selector: 'app-newsupplier',
  standalone: true,
  imports: [ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    CommonModule,
    MatIconModule
  ],
  templateUrl: './newsupplier.component.html',
  styleUrl: './newsupplier.component.css'
})
export class NewsupplierComponent {
   supplierForm!: FormGroup;
   @ViewChild('videoElement') videoElement!: ElementRef;
   @ViewChild('canvasElement') canvasElement!: ElementRef;
   @ViewChild('supplierName', { static: true }) supplierName!: ElementRef;

   
   imageUrl: string | ArrayBuffer | null = null;
   showCaptureButton = false;
  selectFiles: File|undefined;
  photoPreview: string|undefined;
    constructor(@Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,public dialogRef: MatDialogRef<NewsupplierComponent>,
    private userService:UserService){
      console.log('in dialogue boxxxxxxx',data)
      this.supplierForm = this.fb.group({
        id:[data.id || ''],
        suppliername: [data.suppliername || '', Validators.required],
        address: [data.address || ''],
        gstno: [data.gstno || ''],
        mobile: [data.mobile || ''],
        email: [data.email || ''],
        prooftype: [data.prooftype || 'A'],
        proofdetails: [data.proofdetails || ''],
        openingbalance: [data.openingbalance || '', Validators.required],
        openingbaltype: [data.openingbaltype || 'CREDIT'],
        openingdetails: [data.openingdetails || ''],
        photo: [null],
      });
      
    }

    onNoClick(): void {
      this.dialogRef.close(this.supplierForm.value); // Close dialog and return 'false'
    }
    onSubmit() {
      if (this.supplierForm.valid) {
        console.log('Form Submitted', this.supplierForm.value);
        if(this.data.id){
          this.userService.editSupplier(this.supplierForm.value).subscribe((resp:any)=>{
            console.log(resp)
          })
        }
        else{
          this.userService.createSupplier(this.supplierForm.value).subscribe((resp:any)=>{
            console.log(resp)
          })
        }

        this.onNoClick()
      } else {
        console.log('Form is invalid');
      }
    }
    ngOnInit(){
      setTimeout(() => {
        this.supplierName.nativeElement.focus();
      }, 0);
    }
    openCamera() {
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
                this.selectFiles = file;
                const reader = new FileReader();
                reader.onload = () => {
                  this.photoPreview = reader.result as string;

                };
                reader.readAsDataURL(file);
              

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
          // this.billform.patchValue({
          //   image_path: file.name,
          // });
  
          console.log('Selected file:', this.selectFiles);
  
          // Trigger change detection manually
         // this.cdr.detectChanges(); // Force change detection
        };
  
        reader.readAsDataURL(file); // Read the file as a data URL
      } else {
        console.log('No file selected.');
      }
    }     // Function to get productTypeNo by productTypeCode

    removeCustomerPhoto(event: Event) {
      event.stopPropagation(); // Stop event bubbling
      event.preventDefault(); // Prevent default behavior (e.g., file dialog opening)
      this.photoPreview = '';
      this.selectFiles = undefined;
    }
  
  
}
