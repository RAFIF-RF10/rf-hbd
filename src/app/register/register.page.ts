import { Component, OnInit } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage  {
  packages: any[] = [];
  selectedPackage: any = null;
  isPaid: boolean = false; // Kontrol pembayaran
  name: string = '';
  address: string = '';
  phone: string = '';
  paymentMethod: string = ''; // Pilihan metode pembayaran
  cardType: string = ''; // Pilihan tipe kartu kredit
  cardNumber: string = ''; // Nomor kartu kredit
  paymentId: string = ''; // ID untuk PayPal atau Dana

  constructor() {
    this.loadPackages();
  }

  // Fungsi untuk memilih paket
  selectPackage(pkg: any) {
    this.selectedPackage = pkg;
    this.isPaid = false; // Reset status pembayaran
  }

  // Fungsi untuk melakukan pembayaran
  payForPackage() {
    if (!this.paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (this.paymentMethod === 'creditCard' && !this.cardNumber) {
      alert('Please enter your card number');
      return;
    }

    if ((this.paymentMethod === 'paypal' || this.paymentMethod === 'dana') && !this.paymentId) {
      alert('Please enter your Payment ID');
      return;
    }

    // Proses pembayaran - Anda bisa menambahkan logika untuk menghubungkan dengan API pembayaran
    alert('Payment Successful!');
    this.isPaid = true; // Tandai pembayaran berhasil
  }

  // Fungsi untuk mendapatkan daftar paket
  loadPackages() {
    CapacitorHttp.get({
      url: 'https://epos.pringapus.com/api/v1/Authentication/getPackages',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response: any) => {
        if (response.data.status) {
          this.packages = response.data.data;
        } else {
          alert('Failed to load packages');
        }
      })
      .catch((err) => {
        console.error(err);
        alert('Error fetching packages');
      });
  }

  // Fungsi untuk melakukan registrasi
  register() {
    if (!this.name || !this.address || !this.phone || !this.selectedPackage) {
      alert('All fields must be filled');
      return;
    }

    const data = {
      name: this.name,
      address: this.address,
      phone: this.phone,
    };

    CapacitorHttp.post({
      url: 'https://epos.pringapus.com/api/v1/Authentication/register',
      data: data,
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response: any) => {
        if (response.data.status) {
          alert('Registration successful');
        } else {
          alert(response.data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        alert('Error during registration');
      });
  }
}
