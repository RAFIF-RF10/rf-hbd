import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';

@Component({
  selector: 'app-riwayat',
  templateUrl: './riwayat.page.html',
  styleUrls: ['./riwayat.page.scss'],
  standalone: true, // Komponen standalone
  imports: [CommonModule, IonicModule],
})
export class RiwayatPage {
  riwayatList: any[] = []; // Untuk menyimpan data riwayat
  isLoading: boolean = false; // Indikator loading
  errorMessage: string = ''; // Pesan error
  customer_name:string = '';
  customer_phone:string = '';
  storedUserData: object = {}

  constructor() {}

  ngOnInit() {
    this.loadUserData();
    this.fetchRiwayat();
  }

  loadUserData() {
    const storedUserData = localStorage.getItem('user_data');

    if (storedUserData) {
      const userData = JSON.parse(storedUserData); // Parsing stringified data
      this.customer_name = userData.userData.username;
      this.customer_phone = userData.userData.phone;
    } else {
      console.log('No user data found in localStorage');
    }
  }
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID').format(amount).replace(/,/g, '.');
  }


  async fetchRiwayat() {
    this.isLoading = true; // Tampilkan indikator loading
    this.errorMessage = ''; // Reset pesan error
    console.log('test' + this.customer_phone);

    try {
      const response = await CapacitorHttp.get({
        url: `https://epos.pringapus.com/api/v1/Riwayat/getRiwayat/${this.customer_phone}/${this.customer_name}` , // URL endpoint
        headers: {
          'Content-Type': 'application/json', // Header untuk request
        },
      });

      if (response.data && response.data.status) {
        this.riwayatList = response.data.data; // Ambil data riwayat
      } else {
        this.errorMessage = response.data.message || 'Data tidak ditemukan.';
      }
    } catch (error) {
      this.errorMessage = 'Terjadi kesalahan saat memuat data.';
      console.error(error);
    } finally {
      this.isLoading = false; // Sembunyikan indikator loading
    }
  }

  getPaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
      CA: 'Cash',
      VA: 'Virtual Account',
      TF: 'Transfer',
      DC: 'Debit/Credit Card'
    };
    return methods[method] || 'Metode tidak dikenal';
  }
}
