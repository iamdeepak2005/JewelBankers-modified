import { Component } from '@angular/core';
import { JewelleryHeaderComponent } from "../jewellery-header/jewellery-header.component";

@Component({
  selector: 'app-jewellery-search',
  standalone: true,
  imports: [JewelleryHeaderComponent],
  templateUrl: './jewellery-search.component.html',
  styleUrl: './jewellery-search.component.css'
})
export class JewellerySearchComponent {

}
