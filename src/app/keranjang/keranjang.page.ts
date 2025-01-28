import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart.service';
import { Router } from '@angular/router';
import { CapacitorHttp } from '@capacitor/core';

@Component({
  selector: 'app-keranjang',
  templateUrl: './keranjang.page.html',
  styleUrls: ['./keranjang.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule],
})
export class KeranjangPage implements OnInit {
  cartItems: any[] = [];
  selectedItems: any[] = [];
  selectAllChecked: boolean = false;
  paymentMethod: string = '';
  paymentOptions: string[] = ['CA', 'VA', 'TF', 'DC']; // Metode pembayaran sesuai dengan nilai ENUM yang diizinkan

  constructor(public router: Router, private cartService: CartService) {}

  ngOnInit() {
    this.cartItems = this.cartService.getCartItems();
    console.log('Nilai awal paymentMethod:', this.paymentMethod);
  }

  toggleSelection(item: any, event: any) {
    if (event.target.checked) {
      if (!this.selectedItems.includes(item)) {
        this.selectedItems.push(item);
      }
    } else {
      this.selectedItems = this.selectedItems.filter((i) => i !== item);
    }
    this.updateSelectAllStatus();
  }

  toggleSelectAll(event: any) {
    this.selectAllChecked = event.target.checked;
    if (this.selectAllChecked) {
      this.selectedItems = [...this.cartItems]; // Pilih semua item
    } else {
      this.selectedItems = []; // Hapus semua item dari pilihan
    }
  }

  updateSelectAllStatus() {
    this.selectAllChecked =
      this.cartItems.length > 0 &&
      this.selectedItems.length === this.cartItems.length;
  }

  calculateTotal(): number {
    return this.selectedItems.reduce(
      (total, item) => total + item.price * item.qty,
      0
    );
  }

  getItemCount(): number {
    return this.cartItems.length;
  }

  async pay() {
    if (this.selectedItems.length === 0) {
      alert('Pilih setidaknya satu item sebelum melakukan pembayaran!');
      return;
    }

    if (!this.paymentMethod || this.paymentMethod === '') {
      alert('Pilih metode pembayaran sebelum melanjutkan!');
      return;
    }

    //  Ambil data user dari localStorage
    const userDataString = localStorage.getItem('user');

    if (!userDataString) {
      alert('Data pengguna tidak ditemukan! Coba logout dan login ulang.');
      return;
    }

    let user;
    try {
      user = JSON.parse(userDataString);
      console.log('Parsed User Data:', user);
    } catch (error) {
      console.error('Error parsing user data:', error);
      alert('Terjadi kesalahan membaca data pengguna.');
      return;
    }

    if (!user.id_outlet || !user.username || !user.phone) {
      alert('Data pengguna tidak lengkap! Silakan login ulang.');
      return;
    }

    // 🔹 Persiapkan data pesanan
    const orderData = {
      id_outlet: user.id_outlet,
      customer_name: user.username,
      customer_phone: user.phone,
      customer_payment_total: this.calculateTotal(),
      customer_payment_method: this.paymentMethod, // Pastikan sesuai ENUM
      customer_payment_detail: this.selectedItems
    };

    try {
      const response = await CapacitorHttp.post({
        url: 'https://epos.pringapus.com/api/v1/cart/checkout',
        data: orderData,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = response.data;

      if (result.status) {
        alert('Pembayaran berhasil! Pesanan Anda telah diterima.');

        // Bersihkan keranjang setelah pembayaran sukses
        this.selectedItems.forEach((item) => this.cartService.removeItem(item));
        this.cartItems = this.cartService.getCartItems();
        this.selectedItems = [];
        this.paymentMethod = '';
        this.selectAllChecked = false;

        this.router.navigate(['/riwayat']);
      } else {
        alert('Gagal melakukan pembayaran: ' + result.message);
      }

    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      alert('Terjadi kesalahan saat memproses pembayaran.');
    }
  }

  removeItem(item: any) {
    this.cartService.removeItem(item);
    this.cartItems = this.cartService.getCartItems();
    this.selectedItems = this.selectedItems.filter((i) => i !== item);
    this.updateSelectAllStatus();
  }

  onPaymentMethodChange(event: any) {
    console.log('Metode pembayaran dipilih:', this.paymentMethod);
  }
}
