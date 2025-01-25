import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-keranjang',
  templateUrl: './keranjang.page.html',
  styleUrls: ['./keranjang.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule],
})
export class KeranjangPage implements OnInit {
  cartItems: any[] = [];
  selectedItems: any[] = []; // Array untuk item yang dipilih
  selectAllChecked: boolean = false; // Status checkbox "Select All"

  constructor(public router: Router, private cartService: CartService) {}

  ngOnInit() {
    this.cartItems = this.cartService.getCartItems();
  }

  // Mengatur item yang dichecklist
  toggleSelection(item: any, event: any) {
    if (event.target.checked) {
      this.selectedItems.push(item);
    } else {
      this.selectedItems = this.selectedItems.filter((i) => i !== item);
    }
    this.updateSelectAllStatus();
  }

  // Mengatur "Select All"
  toggleSelectAll(event: any) {
    this.selectAllChecked = event.target.checked;

    if (this.selectAllChecked) {
      this.selectedItems = [...this.cartItems]; // Pilih semua item
    } else {
      this.selectedItems = []; // Hapus semua item dari pilihan
    }
  }

  // Perbarui status "Select All" saat item dipilih atau dihapus
  updateSelectAllStatus() {
    this.selectAllChecked = this.selectedItems.length === this.cartItems.length;
  }

  // Hitung total berdasarkan item yang dipilih
  calculateTotal(): number {
    return this.selectedItems.reduce(
      (total, item) => total + item.price * item.qty,
      0
    );
  }

  // Hitung jumlah item unik di keranjang
  getItemCount(): number {
    return this.cartItems.length;
  }

  // Pembayaran
  pay() {
    if (this.selectedItems.length > 0) {
      alert('Pembayaran berhasil!');
      this.selectedItems.forEach((item) => this.cartService.removeItem(item));
      this.cartItems = this.cartService.getCartItems();
      this.selectedItems = [];
      this.selectAllChecked = false; // Reset "Select All"
    } else {
      alert('Silakan pilih item untuk dibayar!');
    }
  }

  // Menghapus item
  removeItem(item: any) {
    this.cartService.removeItem(item);
    this.cartItems = this.cartService.getCartItems();
    this.selectedItems = this.selectedItems.filter((i) => i !== item);
    this.updateSelectAllStatus();
  }
}
