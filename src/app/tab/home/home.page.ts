import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { IonRouterOutlet } from '@ionic/angular';
import { Router } from '@angular/router';
import { CartService } from 'src/app/services/cart.service';
import { CapacitorHttp } from '@capacitor/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [CommonModule, IonModal],
})
export class HomePage implements OnInit {
  @ViewChild('itemModal') itemModal!: IonModal;
  @ViewChild(IonRouterOutlet, { static: true }) ionRouterOutlet!: IonRouterOutlet;

  selectedFilter: string = 'All';
  selectedItem: any = null;
  qty: number = 1;
  cartCount: number = 0;
  searchQuery: string = '';

  items: any[] = [];
  filteredItems: any[] = [];
  categories: any[] = [];

  constructor(public router: Router, private cartService: CartService) {}

  ngOnInit() {
    // Ambil data produk dan kategori saat halaman dimuat
    this.getCategories();
    this.getItems();

    // Update jumlah item unik di keranjang
    this.cartService.cartItems$.subscribe((items) => {
      this.cartCount = items.length;
    });
  }

  // Fungsi untuk mengambil data kategori dari API
  async getCategories() {
    try {
      const response = await CapacitorHttp.get({
        url: 'https://epos.pringapus.com/api/v1/Product_category/getProductCategoryList',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (Array.isArray(response.data.data)) {
        console.log('Kategori berhasil diambil:', response.data.data); // Cek data kategori
        this.categories = response.data.data;
        this.categories.unshift({ id: 'All', name: 'All' }); // Menambahkan kategori 'All'
      } else {
        console.error('Data kategori tidak dalam format array:', response.data.data);
      }
    } catch (error) {
      console.error('Terjadi kesalahan saat mengambil kategori:', error);
    }
  }

  // Fungsi untuk mengambil data produk dari API
  async getItems() {
    try {
      const response = await CapacitorHttp.get({
        url: 'https://epos.pringapus.com/api/v1/Product_category/get_products',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (Array.isArray(response.data)) { // Validasi apakah respons berupa array
        console.log('Produk berhasil diambil:', response.data);
        this.items = response.data; // Simpan data produk langsung ke `items`
        this.filteredItems = [...this.items]; // Tampilkan semua produk
      } else {
        console.error('Data produk tidak dalam format array:', response.data);
      }
    } catch (error) {
      console.error('Terjadi kesalahan saat mengambil produk:', error);
    }
  }


  // Fungsi untuk membuka modal dengan detail item
  openModal(item: any) {
    this.selectedItem = item;
    this.qty = 1;

    if (this.itemModal) {
      this.itemModal.present().catch((error) => {
        console.error('Error saat membuka modal:', error);
      });
    } else {
      console.error('Modal belum diinisialisasi');
    }
  }

  // Fungsi untuk menambahkan item ke keranjang
  addToCart() {
    if (this.selectedItem) {
      this.cartService.addToCart(this.selectedItem, this.qty);
      if (this.itemModal) {
        this.itemModal.dismiss();
      }
    }
  }

  // Fungsi untuk membuka detail produk
  openDetailPage(item: any) {
    this.selectedItem = item;
    this.router.navigate(['/detail'], { state: { item } });
  }

  // Fungsi untuk menambah kuantitas item
  incrementQty() {
    this.qty += 1;
  }

  // Fungsi untuk memilih filter produk berdasarkan kategori
  selectFilter(filter: string) {
    this.selectedFilter = filter;

    if (filter === 'All') {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter((item) => item.id_category === filter);
    }
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


  // Fungsi untuk menangani perubahan pencarian produk
  onSearchChange(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredItems = this.items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) &&
        (this.selectedFilter === 'All' || item.category_id === this.selectedFilter)
    );
  }
}
