import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UserService } from '../user.service';
import { Settings } from './setting';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    HeaderComponent,
    FooterComponent,ReactiveFormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css']
})
export class SettingsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['paramId', 'paramValue', 'paramExample'];
  dataSource = new MatTableDataSource<Settings>([]);
  settingForm: FormGroup;
  myControl = new FormControl('');
  settings: Settings[] = [];
  filteredSettings: any[] = []; // For storing filtered settings
  settingsPayload: any[] = [];
  setting: any;
  filteredOptions: Observable<Settings[]> = of([]);
  customer: any;
  
  @ViewChild('myInput') myInputElement!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient,
    private userService: UserService,private authService: AuthService,private snackBar:MatSnackBar
  ) {
    this.settingForm = this.fb.group({
      searchQuery: [''],
      billPledgeSerial: this.fb.array([], [Validators.required])  // Initialize the form array
    });
  }

  ngAfterViewInit() {
    this.myInputElement.nativeElement.focus();
  }

  ngOnInit(): void {
    this.fetchSettings();
  }

  get billPledgeSerial(): FormArray {
    return this.settingForm.get('billPledgeSerial') as FormArray;
  }

  addFormControls() {
    const formArray = this.billPledgeSerial;
    formArray.clear();
    this.settings.forEach((setting: Settings) => {
      formArray.push(this.fb.control(setting.paramValue));
    });
    this.cdr.detectChanges();
  }

  onSubmit() {

    
    // Create an array of settings objects with updated values from the form
    const updatedSettings = this.billPledgeSerial.controls.map((control, index) => ({
      ...this.settings[index], // Preserve existing data and only update values
      paramValue: control.value
    }));
  
    console.log('Updated settings:', updatedSettings);
    this.userService.updateSettings(updatedSettings).subscribe(
      (resp: any) => {
        // Success handling
        this.setting = resp;
        console.log('Response from server:', this.setting);
        
        // Optionally, show a success message (using Snackbar, Toast, etc.)
        this.snackBar.open('Settings updated successfully!', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
        });
      },
      (error: any) => {
        // Error handling
        console.error('Error occurred:', error);
        
        // Optionally, show an error message
        let errorMessage = 'An error occurred while updating settings.';
        
        if (error.status === 500) {
          errorMessage = 'Internal server error. Please try again later.';
        } else if (error.status === 404) {
          errorMessage = 'Settings not found.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid data. Please check your inputs.';
        }
        
        this.snackBar.open(errorMessage, 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
        });
      }
    );
    sessionStorage.removeItem('settings')

    //this.fetchSettings()

    
  }
    new() {
    return this.settings.map(setting => ({
      paramSeq: setting.paramSeq,
      paramId: setting.paramId,
      paramValue: setting.paramValue,
      paramExample: setting.paramExample
    }));
  }

  filteredItems(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const filteredInput = inputElement.value;
    this.dataSource.filter = filteredInput.trim().toLowerCase();
  }

  fetchSettings() {
   // const url = 'http://localhost:8080/jewelbankersapi/settings';
    this.userService.getSettings().subscribe(list => {
      this.settings = list;
      this.dataSource.data = list;
      this.addFormControls();

    });
    this.cdr.detectChanges();
  }
}
