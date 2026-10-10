import { Component } from '@angular/core';
import { LoaderService } from '../services/loader.service';

@Component({
  standalone:true,
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css'],
})
export class LoaderComponent {
  isLoading: boolean = false;

  constructor(private loaderService: LoaderService) {
    this.loaderService.loading$.subscribe((state) => {
      this.isLoading = state;
    });
  }
}
