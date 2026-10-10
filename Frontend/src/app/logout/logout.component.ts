import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { UserService } from '../user.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [MatButtonModule, HeaderComponent, FooterComponent],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css'
})
export class LogoutComponent {

  constructor(private authService:AuthService,private router:Router, private userService: UserService){

  }
  logout(){
    this.authService.logout();
    this.userService.logout().subscribe(
      response => {
        console.log('Logout successful:', response);
        // Redirect to login or homepage after logout
        //window.location.href = '/login'; // Or use Angular routing to navigate
      },
      error => {
        console.error('Logout error:', error);
      }
    );
    
    this.router.navigate(['/']).then(() => {
      window.location.reload(); // Force reload after navigation
    })  }
}
