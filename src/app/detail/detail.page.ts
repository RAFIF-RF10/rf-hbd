import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // Sudah benar, ini perlu
import { Router } from '@angular/router';
import { IonModal } from '@ionic/angular/standalone';
import { IonRouterOutlet } from '@ionic/angular';
import { CartService } from '../services/cart.service';
import { CapacitorHttp } from '@capacitor/core';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, IonModal], // Pastikan CommonModule sudah di sini
})
export class DetailPage implements OnInit {
  @ViewChild('detailModal') detailModal!: IonModal;
  @ViewChild(IonRouterOutlet, { static: true }) ionRouterOutlet!: IonRouterOutlet;

  constructor(public router: Router, private cartService: CartService) {}

  item: any;
  qty: number = 1;

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras.state) {
      this.item = navigation.extras.state['item'];
    }
  }

  addToCart(item: any) {
    this.item = item;
    if (this.item) {
      this.cartService.addToCart(this.item, this.qty); // Tambahkan item ke keranjang
      this.detailModal.dismiss();
      // Tutup modal, tidak diarahkan ke halaman lain
    }
  }

  openModal(item: any) {
    this.item = item;
    this.qty = 1;
    this.detailModal.present();
  }

  incrementQty() {
    this.qty += 1;
  }

  decrementQty() {
    if (this.qty > 1) {
      this.qty -= 1;
    }
  }

  calculateTotal(): number {
    return this.item ? this.item.price * this.qty : 0;
  }

  async deleteProduct(id: string) {
    if (!id) {
      console.error('ID produk tidak ditemukan');
      return;
    }

    console.log("Menghapus produk dengan ID:", id);

    const userConfirm = window.confirm("Apakah Anda yakin ingin menghapus produk ini?");
    if (!userConfirm) return;

    try {
      const response = await CapacitorHttp.post({
        url: `https://epos.pringapus.com/api/v1/Product_category/deleteProduct/${id}`, // ID di URL
        headers: { 'Content-Type': 'application/json' }
      });

      console.log("Response dari server:", response);

      if (response.data.status) {
        console.log('Produk berhasil dihapus');
        this.router.navigate(['tab/home'], { state: { deletedItemId: id } });
      } else {
        console.error('Gagal menghapus produk:', response.data.message);
      }
    } catch (error) {
      console.error('Error saat menghapus produk:', error);
    }
  }



}
