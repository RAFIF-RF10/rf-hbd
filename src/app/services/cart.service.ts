import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: any[] = [];
  private cartItemsSubject = new BehaviorSubject<any[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable(); 

  constructor() {
    this.loadCartFromStorage();
  }

  private saveCartToStorage() {
    localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
  }

  private loadCartFromStorage() {
    const storedCart = localStorage.getItem('cartItems');
    if (storedCart) {
      this.cartItems = JSON.parse(storedCart);
      this.cartItemsSubject.next(this.cartItems);
    }
  }


  addToCart(item: any, qty: number) {
    const existingItem = this.cartItems.find((cartItem) => cartItem.name === item.name);
    if (existingItem) {
      existingItem.qty += qty;
    } else {
      this.cartItems.push({ ...item, qty });
    }
    this.saveCartToStorage();
    this.cartItemsSubject.next(this.cartItems);
  }

  getCartItems() {
    return this.cartItems;
  }

  removeItem(item: any) {
    this.cartItems = this.cartItems.filter((cartItem) => cartItem.name !== item.name);
    this.saveCartToStorage();
    this.cartItemsSubject.next(this.cartItems); 
  }

  clearCart() {
    this.cartItems = [];
    this.saveCartToStorage();
    this.cartItemsSubject.next(this.cartItems);
  }
}
