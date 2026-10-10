import { Component, Inject, inject, NgModule, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import {AsyncPipe} from '@angular/common';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {default as _rollupMoment} from 'moment';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {OnInit} from '@angular/core';
import { MatListModule } from '@angular/material/list';
import {MatCardModule} from '@angular/material/card';
import {AuthService} from '../auth.service';
import { ToastrService } from 'ngx-toastr'; 
import { AppConstants } from '../common/appconstants';
import { GoogleLoginProvider, SocialAuthService } from '@abacritt/angularx-social-login';
import { UserService } from '../user.service';
import { WarningDialogComponent } from '../warning-dialog/warning-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { RatesCardComponent } from '../../rates-card/rates-card.component';
import { AppComponent } from '../app.component';
import { Meta } from '@angular/platform-browser';


declare let google: any; 

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  standalone: false
})


export class HomeComponent implements OnInit, OnDestroy {
  
  texts = [
    // { text: `Gold Rate : ${localStorage.getItem('gold')} \n Silver Rate : ${localStorage.getItem('silver')}` },
    { text: 'Experience New AI Features', imageUrl: 'img/image1.png' },
    { text: 'Manage Your bills now..', imageUrl: 'img/image2.png' },
    // { text: 'Customize as you like', imageUrl: 'img/jewelbankers_logo.jpg' }
  ];
  load:boolean=false
  
  currentIndex = 0;
  interval: any;
  daysLeft:any
  isNotAuthenticated:boolean=true
  transactions: any[] = [];
  settings:any
  a:any
  isWarning:boolean=false
  bullets = [1, 2, 3];

  googleURL = AppConstants.GOOGLE_AUTH_URL;
  loginForm : FormGroup;
  apiUrl: any = "";
  dataSource: any;
  id: any;
  baseUrl: string | undefined;
  domainURL: string | undefined;
  pythonURL: string | undefined;
  gold: any;
  silver: any;
  constructor(private fb: FormBuilder, private metaService: Meta,private router: Router,private http:HttpClient,private appComponent: AppComponent,
    private authService: AuthService,public dialog: MatDialog, @Inject(DOCUMENT) private document: Document, private toastr: ToastrService,private userService:UserService) {
    this.loginForm= new FormGroup({
      username: new FormControl("",[Validators.required,Validators.maxLength(21)]),
      password: new FormControl("",[Validators.required,Validators.maxLength(21)])
    })
    this.initGoogleSignIn();
  }



  login(form:any) {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.load=true
    this.authService.signIn(this.loginForm.value.username, this.loginForm.value.password).subscribe(
      response => {
        this.load=false
        console.log('Login successful', response);
        //this.toastr.success("Login successful", "success", { positionClass: 'toast-top-left' });
        console.log(response.roles);
        
        console.log(response.roles.filter((item: string) => item == "ROLE_ADMIN")>0);
        console.log(response.roles.filter((item: string) => item == "ROLE_USER"));
        
        if(response.roles.filter((item: string) => item == "ROLE_ADMIN").length>0){
          console.log("admin screen")
          this.router.navigate(['/admin']).then(() => {
            window.location.reload(); // Force reload after navigation
          });;
          // sessionStorage.setItem('userloggedin','true')
        }else if(response.roles.filter((item: string) => item == "ROLE_USER").length>0){
          this.userService.getUserById(sessionStorage.getItem('id')).subscribe(
            (result) => {
              // Log the result once the HTTP request has completed
              console.log('All eyes here:', result);
              
              // Assign the result to this.a
              this.a = result;
              
              // Ensure 'this.a' is not undefined or null before proceeding
              if (this.a && this.a.daysLeft !== undefined) {
                // Now check the value of 'daysLeft' and open dialogs accordingly
                if (this.a.daysLeft <= 0) {
                  // Remove the token from sessionStorage
                  sessionStorage.removeItem('accessToken');
      
      
                  this.isNotAuthenticated = true;
                  const dialogRef = this.dialog.open(WarningDialogComponent, {
                    width: '460px',
                    maxWidth: '95vw',
                    data: { isNotAuthenticated: true, isWarning: false,daysLeft:this.a.daysLeft } // Passing the values correctly
                  });
              
                  dialogRef.afterClosed().subscribe(result => {
                    if (result) {
                      // Handle the case when dialog was confirmed/closed with "true"
                    } else {
                      // Handle the case when dialog was canceled/closed with "false"
                    }
                  });
                }else{
                  this.router.navigate(['/login']).then(() => {
                    window.location.reload(); // Force reload after navigation
                  }); // Navigate to dashboard or any secured route
      
                }
              
                if (this.a.daysLeft > 0 && this.a.daysLeft <= 3) {
                  this.isWarning = true;
                  const dialogRef = this.dialog.open(WarningDialogComponent, {
                    width: '460px',
                    maxWidth: '95vw',
                    data: { isNotAuthenticated: false, isWarning: true,daysLeft:this.a.daysLeft } // Passing the values correctly
                  });
              
                  dialogRef.afterClosed().subscribe(result => {
                    if (result) {
                      // Handle the case when dialog was confirmed/closed with "true"
                      
                    } else {
                      // Handle the case when dialog was canceled/closed with "false"
                    }
                  });
                  this.router.navigate(['/login']);

                }
                else{
                  this.router.navigate(['/login']); // Navigate to dashboard or any secured route
      
                }
              } else {
                console.error("Invalid or missing data in response.");
              }
            },
            (error) => {
              // Handle error if the HTTP request fails
              console.error('Error fetching user:', error);
            }
          );
      

          this.router.navigate(['/login']);
          // sessionStorage.setItem('userloggedin','true')
        }
      },
      error => {
        console.error('Login failed', error);
        this.toastr.success(error?.error?.message || 'Error', "danger", { positionClass: 'toast-top-left' });
      }
    );
  }

  decodeJWTToken(token: string){
    return JSON.parse(atob(token.split(".")[1]))
  }
  handleOauthResponse(response: { credential: any; }){
    console.log(response);
    
    const responsePayload = this.decodeJWTToken(response.credential)
    console.log(responsePayload)
    sessionStorage.setItem('loggedinUser',JSON.stringify(responsePayload))
    // window.location('/your-desired-place') 
    //Changed the above URL where you want user to be redirected
  }

  // initGoogleSignIn() {
    // if(google){
    //   google.accounts.id.initialize({
    //     client_id: "1093408845293-vcpp9qn5s3455m2avc5392qlqrglpf13.apps.googleusercontent.com",
    //     callback: this.handleGoogleSignInResponse.bind(this)
    //   });
    //   google.accounts.id.renderButton(document.getElementById('google-signin-button'), {
    //     theme: 'outline',
    //     size: 'large'
    //   });
    // }
      // google.accounts.id.initialize({
      //   client_id: "1093408845293-vcpp9qn5s3455m2avc5392qlqrglpf13.apps.googleusercontent.com",
      //   callback: this.handleGoogleSignInResponse.bind(this)
      // });
      // google.accounts.id.renderButton(document.getElementById('google-signin-button'), {
      //   theme: 'outline',
      //   size: 'large'
      // });



  //     if (typeof google !== 'undefined' && google.accounts) {
  //       google.accounts.id.initialize({
  //         client_id: '1093408845293-vcpp9qn5s3455m2avc5392qlqrglpf13.apps.googleusercontent.com',
  //         callback: this.handleGoogleSignInResponse.bind(this)
  //       });

  //       // Ensure the DOM element exists before rendering the button
  //       const signInButton = document.getElementById('google-signin-button');
  //       if (signInButton) {
  //         google.accounts.id.renderButton(signInButton, {
  //           theme: 'outline',
  //           size: 'large'
  //         });
  //       }
  //     }
  // }
  initGoogleSignIn(): void {
    // Check if Google API is loaded and available
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.initialize({
        client_id: '1093408845293-vcpp9qn5s3455m2avc5392qlqrglpf13.apps.googleusercontent.com',
        callback: this.handleGoogleSignInResponse.bind(this)
      });

      // Ensure the DOM element exists before rendering the button
      const signInButton = document.getElementById('google-signin-button');
      if (signInButton) {
        google.accounts.id.renderButton(signInButton, {
          theme: 'outline',
          size: 'large'
        });
      }
    }
  }


  handleGoogleSignInResponse(response: any) {
    if (response.error) {
      console.error('Google Sign-In error:', response.error);
      // Handle error
    } else {
      const idToken = response.credential;
      console.log("idToken"+idToken);
      // Send idToken to backend for validation and JWT generation
      this.sendTokenToBackend(idToken);
    }
  }

  roughPrint(){
    this.router.navigate(['/rough']).then(() => {
      window.location.reload(); // Force reload after navigation
    });
  }

  sendTokenToBackend(idToken: string) {
    this.load=true
    // Send idToken to backend for validation and JWT generation
    this.http.post<any>(`${this.apiUrl}social/loginSuccess`, { credential: idToken })
      .subscribe(
        response => {
          this.load=false
          if (response && response.token) {
            localStorage.setItem("user", JSON.stringify(response));
            const userString = localStorage.getItem("user") || "{}";
            const user = JSON.parse(userString); // Now it's safe to parse
            console.log(user.userId);
            
            if(user.userId){
              this.id=user.userId
            }
            else if(sessionStorage.getItem('id')){
              this.id=user.userId

            }
            //console.log(user);

            this.saveToken(response.token);
            this.userService.getUserById(JSON.parse(localStorage.getItem('user') || '{}').userId).subscribe(
              (result) => {
                // Log the result once the HTTP request has completed
                console.log('All eyes here:', result);
                
                // Assign the result to this.a
                this.a = result;
                if(this.a>3){
                  this.router.navigate(['/login']).then(() => {
                    window.location.reload(); // Force reload after navigation
                  });
                }
                // Ensure 'this.a' is not undefined or null before proceeding
                if (this.a && this.a.daysLeft !== undefined) {
                  // Now check the value of 'daysLeft' and open dialogs accordingly
                  if (this.a.daysLeft <= 0) {
                    // Remove the token from sessionStorage
                    sessionStorage.removeItem('accessToken');
        
        
                    this.isNotAuthenticated = true;
                    const dialogRef = this.dialog.open(WarningDialogComponent, {
                      width: '460px',
                      maxWidth: '95vw',
                      data: { isNotAuthenticated: true, isWarning: false,daysLeft:this.a.daysLeft } // Passing the values correctly
                    });
                
                    dialogRef.afterClosed().subscribe(result => {
                      if (result) {
                        // Handle the case when dialog was confirmed/closed with "true"
                      } else {
                        // Handle the case when dialog was canceled/closed with "false"
                      }
                    });
                  }else{
                    this.router.navigate(['/login']).then(() => {
                      window.location.reload(); // Force reload after navigation
                    });
        
                  }
                
                  if (this.a.daysLeft > 0 && this.a.daysLeft <= 3) {
                    this.isWarning = true;
                    const dialogRef = this.dialog.open(WarningDialogComponent, {
                      width: '460px',
                      maxWidth: '95vw',
                      data: { isNotAuthenticated: false, isWarning: true,daysLeft:this.a.daysLeft } // Passing the values correctly
                    });
                
                    dialogRef.afterClosed().subscribe(result => {
                      if (result) {
                        // Handle the case when dialog was confirmed/closed with "true"
                        
                      } else {
                        // Handle the case when dialog was canceled/closed with "false"
                      }
                    });
                    this.router.navigate(['/login']).then(() => {
                      window.location.reload(); // Force reload after navigation
                    });
  
                  }
                  else{
                    this.router.navigate(['/login']).then(() => {
                      window.location.reload(); // Force reload after navigation
                    }); // Navigate to dashboard or any secured route
        
                  }
                } else {
                  console.error("Invalid or missing data in response.");
                }
              },
              (error) => {
                // Handle error if the HTTP request fails
                console.error('Error fetching user:', error);
              }
            );
        
  
  
          } else {
            console.error('Failed to receive token');
            // Handle error
          }
        },
        error => {
          console.error('Error processing login:', error);
          // Handle error
        }
      );
  }

  saveToken(token: string) {
    sessionStorage.setItem('accessToken', token); // Save token in cookie for 7 days (adjust as needed)
  }

  ngOnInit(){
    this.gold=localStorage.getItem('gold')
    this.silver=localStorage.getItem('silver')  
    this.appComponent.AI=false
   //window.addEventListener('DOMContentLoaded', () => {
      this.initGoogleSignIn();
    //});
    this.metaService.updateTag({ name: 'canonical', content: 'https://ai.jewelbankers.com/' });
    this.appComponent.setVisibilityForFirstComponent(true);
    const location = window.location;
    const port = location.port;

    if (port === '4200') {
      // Frontend running locally; backend expected on localhost:8081
      this.apiUrl = 'http://localhost:8081/jewelbankersapi/';
      this.domainURL = 'http://localhost:8081/jewelbankersapi/';

    } else if (port === '8080') {
      // Backend running locally
      this.apiUrl = location.origin+'/jewelbankersapi/';
      this.domainURL = location.origin+'/jewelbankersapi/';


    } else {
      // Assume running on EC2 (or other hosted environment)
      this.apiUrl = location.origin+'/jewelbankersapi/';
      this.domainURL = location.origin+'/jewelbankersapi/';
      this.pythonURL='http://ai.jewelbankers.com/jewelbankersai';
    }

    console.log(`Base URL is set to: ${this.baseUrl}`);

    this.startTextSlider();

    if(this.authService.getUserData().accessToken && this.authService.getUserData().roles?.includes('ROLE_ADMIN')){
      this.router.navigate(['/admin']).then(() => {
        window.location.reload(); // Force reload after navigation
      });
    }
    // this.fetch();
    // this.fetch();
  }

  onSubmit(form:any) {
    if (this.loginForm.valid) {
    console.log('Form submitted')
    console.log(this.loginForm.value);
    // this.router.navigate(['/login'])
    }
  }
  public  fetch(){
    this.http.get(`${this.apiUrl}/jewelbankersapi/users`).subscribe(
      (resp:any)=>{
        console.log(resp);
        // this.preciousMetals$ = resp;
      }
    )
  }
  startTextSlider() {
    this.interval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.texts.length;
    }, 3000); // Change text every 2 seconds
  }

  setCurrentIndex(index: number) {
    clearInterval(this.interval); // Optional: clear interval when bullet is clicked
    this.currentIndex = index;
    this.startTextSlider(); // Restart the interval
  }

  ngOnDestroy() {
    clearInterval(this.interval); // Clear the interval when the component is destroyed
  }

  signInWithGoogle(): void {
  }

  isLoggedIn(){
    return this.authService.isLogin()
  }
}



