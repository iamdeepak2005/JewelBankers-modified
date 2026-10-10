import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { JewelleryApiService } from '../../services/jewellery-api.service';
import { DashboardMetrics } from '../../models/jewellery.models';

@Component({
  selector: 'app-jewellery-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class JewelleryDashboardComponent implements OnInit {
  metrics: DashboardMetrics = {
    totalStockCount: 0,
    totalGoldWeightGrams: 0,
    totalSilverWeightGrams: 0,
    totalStockValue: 0,
    todaySalesCount: 0,
    todaySalesAmount: 0,
    totalSalesCount: 0,
    totalSalesAmount: 0,
    activeEstimatesCount: 0,
    oldGoldExchangesCount: 0,
    totalPurchasesCount: 0,
    recentSales: []
  };

  loading = true;
  error = '';

  constructor(private api: JewelleryApiService) {}

  ngOnInit() {
    this.fetchDashboard();
  }

  fetchDashboard() {
    this.loading = true;
    this.api.getDashboardMetrics().subscribe({
      next: (data) => {
        this.metrics = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard metrics', err);
        this.loading = false;
      }
    });
  }
}
