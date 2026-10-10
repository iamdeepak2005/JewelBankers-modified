import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Item } from './jewellery-stock-additon/stock';

@Injectable({
  providedIn: 'root'
})
export class JewellerItemStockingService {
  private itemsSubject = new BehaviorSubject<Item[]>([]);
  items$ = this.itemsSubject.asObservable();

  get items(): Item[] {
    return this.itemsSubject.getValue();
  }
  set items(newItems: Item[]) {
    this.itemsSubject.next(newItems);
  }

  addItem(newItem: Item): void {
    // Get the current items from the BehaviorSubject
    const currentItems = this.itemsSubject.value;

    // Add the new item to the list
    const updatedItems = [...currentItems, newItem];

    // Update the BehaviorSubject with the new list
    this.itemsSubject.next(updatedItems);
  }
  removeItem(itemToRemove: Item): void {
    // Get the current items from the BehaviorSubject
    const currentItems = this.itemsSubject.value;
  
    // Find the index of the item to remove
    const index = currentItems.indexOf(itemToRemove);
  
    // If the item exists in the array, remove it
    if (index >= 0) {
      // Remove the item from the array and update the BehaviorSubject
      const updatedItems = currentItems.filter((item, i) => i !== index);
  
      // Update the BehaviorSubject with the new list
      this.itemsSubject.next(updatedItems);
    }
  }
  
  constructor() { }
}
