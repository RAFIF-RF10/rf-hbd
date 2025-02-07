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

  setDefaultImage(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/image-not-found.png';
  }

}
