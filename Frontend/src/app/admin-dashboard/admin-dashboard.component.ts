import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { AgGridAngular, ICellRendererAngularComp } from 'ag-grid-angular'; // Angular Data Grid Component
import { ColDef, ICellRendererParams } from 'ag-grid-community'; 
import { MatDialog } from '@angular/material/dialog';
import { Router } from 'express';
import { AddUserDialogComponent } from './add-user-dialog.component';
 
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EditUserDialogComponent } from './edituser.component';
import { AuthService } from '../auth.service';
import { HeaderComponent } from '../header/header.component';


@Component({
  selector: 'app-admin-dashboard',  
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  standalone: false
})
export class AdminDashboardComponent implements OnInit {
  columnDefs = [
    { headerName: 'ID', field: 'id' },
    { headerName: 'Username', field: 'username' },
    { headerName: 'Email', field: 'email'},
    { headerName: 'Roles', field: 'rolesString' },
    { headerName: 'Actions', cellRenderer: CustomButtonComponent,
      cellRendererParams: 
      { onClick: this.onDelete.bind(this) , 
        onEditClick: this.onEdit.bind(this) 
      }  
    },
  ];

  rowData: any[] = [];
  gridApi: any;
  teachers: any;

  rowHeight = 50;
  // onGridReady(param: any) {
  //   this.gridApi = param.api;
  //   this.gridApi.sizeColumnsToFit();
  // }

  constructor(private userService: UserService, public dialog: MatDialog,private authService: AuthService) { }

  ngOnInit(): void {
    console.log('Hello');
    
    this.userService.getUsers().subscribe(data => {
      this.rowData = data.map(user => ({
        ...user,
        rolesString: user.roles.map((role: { name: any; }) => role.name).join(', ')
      }));
    });
  }

  onGridReady(param: any): void {
    this.gridApi = param.api;
    this.gridApi.sizeColumnsToFit();
  }

  addUser(): void {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {width: '500px',   height: '500px' // Fixed typo
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.addUser(result).subscribe(() => {
          this.ngOnInit(); // Refresh the user list after adding a new user
        });
      }
    });
  }
  // Implemented edit functionality here
  onEdit(id: number): void {
    console.log('Edit user', id);
    const userToEdit = this.rowData.find(user => user.id === id);
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      data: userToEdit,width: '500px',   height: '500px' // Fixed typo

    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.editUser(id, result).subscribe(() => {
          this.ngOnInit(); // Refresh the user list after editing a user
        });
      }
    });
  }
 // Implemented delete functionality here
  onDelete(id: number): void {
    console.log('Delete user', id);
    this.userService.deleteUser(id).subscribe(() => {
      this.ngOnInit(); // Refresh the user list after deleting a user
    }, error => {
      console.error('Error deleting user', error);
    });
  }
}


@Component({
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button mat-flat-button color="warn" (click)="buttonClicked()">
      <mat-icon>delete</mat-icon>
      Delete User
    </button>
    <button mat-flat-button color="primary" (click)="editClicked()">
      <mat-icon>edit</mat-icon>
      Edit User
    </button>
  `,
})
export class CustomButtonComponent implements ICellRendererAngularComp {
  private params: any;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    return true;
  }

  buttonClicked() {
    if (this.params.onClick) {
      this.params.onClick(this.params.data.id);
    }
  }

  editClicked() {
    if (this.params.onEditClick) {
      this.params.onEditClick(this.params.data.id);
    }
  }
}