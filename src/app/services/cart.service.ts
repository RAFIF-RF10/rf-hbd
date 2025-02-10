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
    const user = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (user?.userData?.username) {
      localStorage.setItem(`cart_${user.userData.username}`, JSON.stringify(this.cartItems));
    }
  }

  private loadCartFromStorage() {
    const user = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (user?.userData?.username) {
      const storedCart = localStorage.getItem(`cart_${user.userData.username}`);
      if (storedCart) {
        this.cartItems = JSON.parse(storedCart);
        this.cartItemsSubject.next(this.cartItems);
      }
    }
  }

  addToCart(item: any, qty: number) {
    const existingItem = this.cartItems.find(cartItem => cartItem.id === item.id);
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
    this.cartItems = this.cartItems.filter(cartItem => cartItem.id !== item.id);
    this.saveCartToStorage();
    this.cartItemsSubject.next(this.cartItems);
  }

  clearCart() {
    this.cartItems = [];
    this.saveCartToStorage();
    this.cartItemsSubject.next(this.cartItems);
  }
  setRefreshRiwayat() {
    localStorage.setItem('refresh_riwayat', 'true');
  }

  shouldRefreshRiwayat() {
    return localStorage.getItem('refresh_riwayat') === 'true';
  }

  clearRefreshRiwayat() {
    localStorage.removeItem('refresh_riwayat');
  }
}
