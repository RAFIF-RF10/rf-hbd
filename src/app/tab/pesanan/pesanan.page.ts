import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';

@Component({
  selector: 'app-pesanan',
  templateUrl: './pesanan.page.html',
  styleUrls: ['./pesanan.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PesananPage implements OnInit {
  pesanan: any[] = [
    { name: 'Produk A', price: 50000, qty: 2, image: 'assets/img/product-a.jpg' },
    { name: 'Produk B', price: 75000, qty: 1, image: 'assets/img/product-b.jpg' },
    { name: 'Produk C', price: 100000, qty: 3, image: 'assets/img/product-c.jpg' }
  ];

  constructor() {}

  ngOnInit() {}

  getTotalHarga(): number {
    return this.pesanan.reduce((total, item) => total + item.price * item.qty, 0);
  }
}
