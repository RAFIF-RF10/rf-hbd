import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { IonSearchbar } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { IonModal } from '@ionic/angular/standalone';
import { ViewChild } from '@angular/core';
import { IonRouterOutlet } from '@ionic/angular';
import { Router } from '@angular/router';
import { CartService } from 'src/app/services/cart.service';
import { CapacitorHttp } from '@capacitor/core';  // Pastikan ini sudah diimpor

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonSearchbar, CommonModule, IonModal],
})
export class HomePage implements OnInit {
  @ViewChild('itemModal') itemModal!: IonModal;
  @ViewChild(IonRouterOutlet, { static: true }) ionRouterOutlet!: IonRouterOutlet;

  selectedFilter: string = 'All';
  selectedItem: any = null;
  qty: number = 1;
  cartCount: number = 0; // Menyimpan jumlah item unik
  searchQuery: string = '';

  items: any[] = []; // Menyimpan data produk yang diambil dari API
  filteredItems: any[] = [...this.items]; // Filtered items berdasarkan pencarian atau filter kategori

  constructor(public router: Router, private cartService: CartService) {}

  ngOnInit() {
    // Ambil data produk dari API saat halaman dimuat
    this.getItems();

    // Update cartCount berdasarkan jumlah item unik di keranjang
    this.cartService.cartItems$.subscribe((items) => {
      this.cartCount = items.length; // Hanya menghitung jumlah item unik
    });
  }

  // Fungsi untuk mengambil data produk dari API
  async getItems() {
    try {
      const response = await CapacitorHttp.get({
        url: 'https://epos.pringapus.com/api/v1/Product_category/get_products', // Ganti dengan URL API produk yang sesuai
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (Array.isArray(response.data.data)) {
        console.log('Produk berhasil diambil:', response);
        this.items = response.data.data; // Menyimpan data produk yang diterima dari API
        this.filteredItems = [...this.items]; // Menampilkan semua produk awalnya
      } else {
        console.error('Data tidak dalam format array:', response.data.data);
      }
    } catch (error) {
      console.error('Terjadi kesalahan saat mengambil produk:', error);
    }
  }

  // Fungsi untuk menambahkan item ke keranjang
  addToCart() {
    if (this.selectedItem) {
      this.cartService.addToCart(this.selectedItem, this.qty); // Tambah item ke keranjang
      this.itemModal.dismiss();
    }
  }

  // Fungsi untuk membuka detail produk
  openDetailPage(item: any) {
    this.selectedItem = item;
    this.router.navigate(['/detail'], { state: { item } });
  }

  // Fungsi untuk membuka modal dengan detail item
  openModal(item: any) {
    this.selectedItem = item;
    this.qty = 1; // Reset qty setiap kali membuka modal
    this.itemModal.present();
  }

  // Fungsi untuk menambah kuantitas item
  incrementQty() {
    this.qty += 1;
  }

  // Fungsi untuk mengurangi kuantitas item
  decrementQty() {
    if (this.qty > 1) {
      this.qty -= 1;
    }
  }

  // Fungsi untuk menghitung total harga berdasarkan kuantitas
  calculateTotal(): number {
    return this.selectedItem ? this.selectedItem.price * this.qty : 0;
  }

  // Fungsi untuk memilih filter kategori produk
  selectFilter(filter: string) {
    this.selectedFilter = filter;
    this.filteredItems =
      filter === 'All'
        ? this.items
        : this.items.filter((item) =>
            item.category.toLowerCase() === filter.toLowerCase()
          );
  }

  // Fungsi untuk menangani perubahan pencarian produk
  onSearchChange(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredItems = this.items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) &&
        (this.selectedFilter === 'All' ||
          item.category.toLowerCase() === this.selectedFilter.toLowerCase())
    );
  }
}
