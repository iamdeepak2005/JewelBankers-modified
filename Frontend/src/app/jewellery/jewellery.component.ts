import { Component } from '@angular/core';
import { JewelleryHeaderComponent } from '../jewellery-header/jewellery-header.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-jewellery',
  standalone: true,
  imports: [JewelleryHeaderComponent, NgxChartsModule,HeaderComponent],
  templateUrl: './jewellery.component.html',
  styleUrls: ['./jewellery.component.css']
})
export class JewelleryComponent {
  colorScheme = 'aqua';
  salesData = [
    {
      "name": "Gold 18K",
      "value": 25000
    },
    {
      "name": "Gold 22K",
      "value": 30000
    },
    {
      "name": "Gold 24K",
      "value": 40000
    },
    {
      "name": "Silver",
      "value": 15000
    }
  ];
  combinedData = [
    {
      "name": "Gold 18K",
      "series": [
        { "name": "2024-11-01", "value": 1520.65 },
        { "name": "2024-11-02", "value": 1554.72 },
        { "name": "2024-11-03", "value": 1498.40 },
        { "name": "2024-11-04", "value": 1542.88 },
        { "name": "2024-11-05", "value": 1530.25 },
        { "name": "2024-11-06", "value": 1551.80 },
        { "name": "2024-11-07", "value": 1512.65 },
        { "name": "2024-11-08", "value": 1561.20 },
        { "name": "2024-11-09", "value": 1499.75 },
        { "name": "2024-11-10", "value": 1543.30 },
        { "name": "2024-11-11", "value": 1505.95 },
        { "name": "2024-11-12", "value": 1540.80 },
        { "name": "2024-11-13", "value": 1532.95 },
        { "name": "2024-11-14", "value": 1508.65 },
        { "name": "2024-11-15", "value": 1525.40 },
        { "name": "2024-11-16", "value": 1503.95 },
        { "name": "2024-11-17", "value": 1542.50 },
        { "name": "2024-11-18", "value": 1517.65 },
        { "name": "2024-11-19", "value": 1538.25 },
        { "name": "2024-11-20", "value": 1510.90 }
      ]
    },
    {
      "name": "Gold 22K",
      "series": [
        { "name": "2024-11-01", "value": 1655.85 },
        { "name": "2024-11-02", "value": 1695.55 },
        { "name": "2024-11-03", "value": 1638.10 },
        { "name": "2024-11-04", "value": 1681.54 },
        { "name": "2024-11-05", "value": 1670.00 },
        { "name": "2024-11-06", "value": 1695.00 },
        { "name": "2024-11-07", "value": 1645.00 },
        { "name": "2024-11-08", "value": 1702.30 },
        { "name": "2024-11-09", "value": 1635.00 },
        { "name": "2024-11-10", "value": 1685.00 },
        { "name": "2024-11-11", "value": 1645.50 },
        { "name": "2024-11-12", "value": 1695.50 },
        { "name": "2024-11-13", "value": 1685.50 },
        { "name": "2024-11-14", "value": 1646.00 },
        { "name": "2024-11-15", "value": 1670.60 },
        { "name": "2024-11-16", "value": 1640.10 },
        { "name": "2024-11-17", "value": 1681.00 },
        { "name": "2024-11-18", "value": 1655.60 },
        { "name": "2024-11-19", "value": 1670.00 },
        { "name": "2024-11-20", "value": 1640.30 }
      ]
    },
    {
      "name": "Gold 24K",
      "series": [
        { "name": "2024-11-01", "value": 1790.10 },
        { "name": "2024-11-02", "value": 1835.55 },
        { "name": "2024-11-03", "value": 1770.60 },
        { "name": "2024-11-04", "value": 1812.10 },
        { "name": "2024-11-05", "value": 1801.30 },
        { "name": "2024-11-06", "value": 1830.80 },
        { "name": "2024-11-07", "value": 1785.40 },
        { "name": "2024-11-08", "value": 1840.50 },
        { "name": "2024-11-09", "value": 1769.60 },
        { "name": "2024-11-10", "value": 1820.20 },
        { "name": "2024-11-11", "value": 1775.40 },
        { "name": "2024-11-12", "value": 1825.50 },
        { "name": "2024-11-13", "value": 1815.20 },
        { "name": "2024-11-14", "value": 1777.10 },
        { "name": "2024-11-15", "value": 1802.40 },
        { "name": "2024-11-16", "value": 1775.00 },
        { "name": "2024-11-17", "value": 1812.90 },
        { "name": "2024-11-18", "value": 1783.50 },
        { "name": "2024-11-19", "value": 1801.60 },
        { "name": "2024-11-20", "value": 1775.80 }
      ]
    },
  ];
  silverRates=[ 
        {
      "name": "Silver",
      "series": [
        { "name": "2024-11-01", "value": 22.45 },
        { "name": "2024-11-02", "value": 22.98 },
        { "name": "2024-11-03", "value": 21.80 },
        { "name": "2024-11-04", "value": 22.25 },
        { "name": "2024-11-05", "value": 22.10 },
        { "name": "2024-11-06", "value": 22.55 },
        { "name": "2024-11-07", "value": 21.90 },
        { "name": "2024-11-08", "value": 22.65 },
        { "name": "2024-11-09", "value": 21.75 },
        { "name": "2024-11-10", "value": 22.50 },
        { "name": "2024-11-11", "value": 21.95 },
        { "name": "2024-11-12", "value": 22.45 },
        { "name": "2024-11-13", "value": 22.35 },
        { "name": "2024-11-14", "value": 21.85 },
        { "name": "2024-11-15", "value": 22.15 },
        { "name": "2024-11-16", "value": 21.90 },
        { "name": "2024-11-17", "value": 22.30 },
        { "name": "2024-11-18", "value": 22.00 },
        { "name": "2024-11-19", "value": 22.20 },
        { "name": "2024-11-20", "value": 21.85 }
      ]
    }

  ]
  salesData1 = [
    {
      "name": "18K Gold", 
      "series": [
        { "name": "2024-12-01", "value": 50000 },
        { "name": "2024-12-02", "value": 55000 },
        { "name": "2024-12-03", "value": 52000 },
        { "name": "2024-12-04", "value": 53000 },
        { "name": "2024-12-05", "value": 54000 }
      ]
    },
    {
      "name": "22K Gold", 
      "series": [
        { "name": "2024-12-01", "value": 60000 },
        { "name": "2024-12-02", "value": 65000 },
        { "name": "2024-12-03", "value": 61000 },
        { "name": "2024-12-04", "value": 62000 },
        { "name": "2024-12-05", "value": 64000 }
      ]
    },
    {
      "name": "24K Gold", 
      "series": [
        { "name": "2024-12-01", "value": 70000 },
        { "name": "2024-12-02", "value": 75000 },
        { "name": "2024-12-03", "value": 71000 },
        { "name": "2024-12-04", "value": 73000 },
        { "name": "2024-12-05", "value": 74000 }
      ]
    },
    {
      "name": "Silver", 
      "series": [
        { "name": "2024-12-01", "value": 30000 },
        { "name": "2024-12-02", "value": 32000 },
        { "name": "2024-12-03", "value": 31000 },
        { "name": "2024-12-04", "value": 31500 },
        { "name": "2024-12-05", "value": 33000 }
      ]
    }
  ];
  bubbleChartData = [
    {
      "name": "18K Gold", 
      "series": [
        { "name": "2024-12-01", "value": 50000, "extra": { "quantity": 300 } },
        { "name": "2024-12-02", "value": 55000, "extra": { "quantity": 350 } },
        { "name": "2024-12-03", "value": 52000, "extra": { "quantity": 320 } },
        { "name": "2024-12-04", "value": 53000, "extra": { "quantity": 330 } },
        { "name": "2024-12-05", "value": 54000, "extra": { "quantity": 340 } }
      ]
    },
    {
      "name": "22K Gold", 
      "series": [
        { "name": "2024-12-01", "value": 60000, "extra": { "quantity": 320 } },
        { "name": "2024-12-02", "value": 65000, "extra": { "quantity": 370 } },
        { "name": "2024-12-03", "value": 61000, "extra": { "quantity": 330 } },
        { "name": "2024-12-04", "value": 62000, "extra": { "quantity": 340 } },
        { "name": "2024-12-05", "value": 64000, "extra": { "quantity": 360 } }
      ]
    },
    {
      "name": "24K Gold", 
      "series": [
        { "name": "2024-12-01", "value": 70000, "extra": { "quantity": 340 } },
        { "name": "2024-12-02", "value": 75000, "extra": { "quantity": 380 } },
        { "name": "2024-12-03", "value": 71000, "extra": { "quantity": 350 } },
        { "name": "2024-12-04", "value": 73000, "extra": { "quantity": 360 } },
        { "name": "2024-12-05", "value": 74000, "extra": { "quantity": 370 } }
      ]
    },
    {
      "name": "Silver", 
      "series": [
        { "name": "2024-12-01", "value": 30000, "extra": { "quantity": 200 } },
        { "name": "2024-12-02", "value": 32000, "extra": { "quantity": 220 } },
        { "name": "2024-12-03", "value": 31000, "extra": { "quantity": 210 } },
        { "name": "2024-12-04", "value": 31500, "extra": { "quantity": 215 } },
        { "name": "2024-12-05", "value": 33000, "extra": { "quantity": 230 } }
      ]
    }
  ];
  
  gaugeChartData = [
    {
      "name": "Gold 18K",
      "value": 4500, // Today's rate for Gold 18K
      "min": 4000, // Minimum value for Gold 18K
      "max": 5500  // Maximum value for Gold 18K
    },
    {
      "name": "Gold 22K",
      "value": 5200, // Today's rate for Gold 22K
      "min": 4800, // Minimum value for Gold 22K
      "max": 6000  // Maximum value for Gold 22K
    },
    {
      "name": "Gold 24K",
      "value": 5600, // Today's rate for Gold 24K
      "min": 5000, // Minimum value for Gold 24K
      "max": 6500  // Maximum value for Gold 24K
    },
    {
      "name": "Silver",
      "value": 70, // Today's rate for Silver
      "min": 60, // Minimum value for Silver
      "max": 100  // Maximum value for Silver
    }
  ];
  
  // Monthly sales data for a line chart
}
