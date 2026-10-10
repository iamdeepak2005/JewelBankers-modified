import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-adds',
  standalone: true,
  imports: [],
  templateUrl: './adds.component.html',
  styleUrls: ['./adds.component.css' ]
})
export class AddsComponent implements AfterViewInit {
  @ViewChild('nextButton', { static: true }) nextButton!: ElementRef;
  @ViewChild('prevButton', { static: true }) prevButton!: ElementRef;
  @ViewChild('slide', { static: true }) slide!: ElementRef;

  items = [
    { name: 'Switzerland', description: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ab, eum!', image: 'https://i.ibb.co/qCkd9jS/img1.jpg' },
    { name: 'Iceland', description: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ab, eum!', image: 'https://i.ibb.co/NSwVv8D/img3.jpg' },
    { name: 'Australia', description: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ab, eum!', image: 'https://i.ibb.co/Bq4Q0M8/img4.jpg' },
    { name: 'Netherlands', description: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ab, eum!', image: 'https://i.ibb.co/jTQfmTq/img5.jpg' },
    { name: 'Ireland', description: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ab, eum!', image: 'https://i.ibb.co/RNkk6L0/img6.jpg' }
  ];

  activeIndex = 0; // Start with the first item as active

  ngAfterViewInit() {
    this.nextButton.nativeElement.addEventListener('click', () => this.onNextClick());
    this.prevButton.nativeElement.addEventListener('click', () => this.onPrevClick());
    this.setActiveItem();
  }

  onNextClick() {
    const items = this.slide.nativeElement.querySelectorAll('.item');
    this.activeIndex = (this.activeIndex + 1) % items.length; // Update active index
    this.slide.nativeElement.appendChild(items[0]); // Move the first item to the end
    this.setActiveItem(); // Update active item
  }

  onPrevClick() {
    const items = this.slide.nativeElement.querySelectorAll('.item');
    this.activeIndex = (this.activeIndex - 1 + items.length) % items.length; // Update active index
    this.slide.nativeElement.prepend(items[items.length - 1]); // Move the last item to the front
    this.setActiveItem(); // Update active item
  }

  setActiveItem() {
    const items = this.slide.nativeElement.querySelectorAll('.item');
    items.forEach((item: any) => item.classList.remove('active')); // Remove active class from all items
    items[this.activeIndex].classList.add('active'); // Mark the currently active item
  }
}
