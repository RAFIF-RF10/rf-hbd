import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart.service';
import { Router } from '@angular/router';
import { CapacitorHttp } from '@capacitor/core';
import { AlertController } from '@ionic/angular'; // Import AlertController

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
  paymentOptions: { code: string, name: string }[] = [];
  deliveryOption: string = 'pickup'; // Default delivery option
  discount: number = 0;
  gst: number = 0;
  customer_name: string = '';
  customer_phone: string = '';

  constructor(
    public router: Router,
    private cartService: CartService,
    private alertController: AlertController // Inject AlertController
  ) { }

  ngOnInit() {
    this.cartItems = this.cartService.getCartItems();
    console.log('Nilai awal paymentMethod:', this.paymentMethod);
    this.getPaymentMethod();
  }

  paymentMethodMapping: { [key: string]: string } = {
    'CA': 'Cash',
    'TF': 'Transfer',
    'DC': 'Debit Card'
  };

  async getPaymentMethod() {
    const user = JSON.parse(localStorage.getItem('user_data') || '{}');

    if (!user || !user.userData || !user.userData.outlet_code) {
      this.presentAlert('Error', 'ID Outlet tidak ditemukan!');
      return;
    }

    try {
      const response = await CapacitorHttp.get({
        url: `https://epos.pringapus.com/api/v1/cart/get_payment_method/${user.userData.outlet_code}`,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = response.data;

      if (result.status) {
        const paymentCodes = result.data.payment_method.split(',');

        this.paymentOptions = paymentCodes.map((code: string) => ({
          code: code.trim(), // Kode metode pembayaran
          name: this.getPaymentName(code.trim()) // Nama metode pembayaran
        }));


        console.log('Metode pembayaran:', this.paymentOptions); // Debugging
      } else {
        this.presentAlert('Error', 'Metode pembayaran tidak ditemukan!');
      }
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      this.presentAlert('Error', 'Gagal mengambil metode pembayaran!');
    }
  }

  getPaymentName(code: string): string {
    const paymentNames: { [key: string]: string } = {
      'CA': 'Cash',
      'TF': 'Transfer',
      'DC': 'Debit',
      'Qris': 'Qris'
    };
    return paymentNames[code] || 'Metode Tidak Dikenal';
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

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

  updateSelectAllStatus() {
    this.selectAllChecked = this.cartItems.length > 0 && this.selectedItems.length === this.cartItems.length;
  }

  calculateSubtotal(): number {
    return this.selectedItems.reduce((total, item) => total + item.price * item.qty, 0);
  }

  calculateTotal(): number {
    this.gst = this.calculateSubtotal() * 0.1; // GST 10%
    return this.calculateSubtotal() - this.discount + this.gst;
  }

  getItemCount(): number {
    return this.cartItems.reduce((total, item) => total + item.qty, 0);
  }

  increaseQty(item: any) {
    item.qty++;
  }

  decreaseQty(item: any) {
    if (item.qty > 1) item.qty--;
  }

  onCustomerNameChange(event: any) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement) {
      const trimmedValue = inputElement.value.trim(); // Hapus spasi di awal & akhir
      this.customer_name = trimmedValue.length > 0 ? trimmedValue : '';
    }
  }

  onCustomerPhoneChange(event: any) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement) {
      let phoneValue = inputElement.value.replace(/\D/g, ''); // Hapus semua selain angka

      // Pastikan diawali dengan "0"
      if (!phoneValue.startsWith('0')) {
        phoneValue = '0' + phoneValue;
      }

      // Batasi maksimal 16 angka
      if (phoneValue.length > 16) {
        phoneValue = phoneValue.slice(0, 16);
      }

      this.customer_phone = phoneValue;
      inputElement.value = phoneValue; // Perbarui nilai input
    }
  }


  async pay() {
    if (this.selectedItems.length === 0) {
      this.presentAlert('Perhatian', 'Pilih setidaknya satu item sebelum melakukan pembayaran!');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user_data') || '{}');

    if (!this.paymentMethod) {
      this.presentAlert('Perhatian', 'Pilih metode pembayaran sebelum melanjutkan!');
      return;
    }

    if (!user || !this.customer_name || !this.customer_phone) {
      this.presentAlert('Perhatian', 'Silakan isi nama dan nomor telepon pelanggan!');
      return;
    }

    // Pastikan metode pembayaran valid
    console.log('Metode pembayaran yang dipilih:', this.paymentMethod);

    const orderData = {
      id_outlet: user.userData.id_outlet,
      customer_name: this.customer_name,
      customer_phone: this.customer_phone,
      customer_payment_total: this.calculateTotal(),
      customer_payment_method: this.paymentMethod, // Langsung pakai string
      customer_payment_detail: this.selectedItems.map(item => ({
        name: item.name,
        price: item.price,
        qty: item.qty
      }))
    };


    console.log('Data yang dikirim:', orderData); // Debugging

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
        this.presentAlert('Sukses', 'Pembayaran berhasil! Pesanan Anda telah diterima.');
        this.cartService.setRefreshRiwayat();
        this.selectedItems.forEach((item) => this.cartService.removeItem(item));
        this.cartItems = this.cartService.getCartItems();
        this.selectedItems = [];
        this.paymentMethod = '';
        this.customer_name = '';
        this.customer_phone = '';
        this.selectAllChecked = false;
      } else {
        this.presentAlert('Gagal', 'Gagal melakukan pembayaran: ' + result.message);
      }
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      this.presentAlert('Error', 'Terjadi kesalahan saat memproses pembayaran.');
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

  setDefaultImage(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/image-not-found.png';
  }

}
