import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-riwayat',
  templateUrl: './riwayat.page.html',
  styleUrls: ['./riwayat.page.scss'],
  standalone: true, // Komponen standalone
  imports: [CommonModule, IonicModule, FormsModule],
})
export class RiwayatPage {
  riwayatList: any[] = [];
  filteredRiwayatList: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  id_outlet: string = '';

  constructor() {}

  ngOnInit() {
    this.loadUserData();
    this.fetchRiwayat();
  }

  loadUserData() {
    const storedUserData = localStorage.getItem('user_data');

    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      this.id_outlet = userData.userData.id_outlet; 
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

    try {
      const response = await CapacitorHttp.get({
        url: `https://epos.pringapus.com/api/v1/Riwayat/getRiwayat/${this.id_outlet}`, // Ganti filter dengan id_outlet
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.status) {
        this.riwayatList = response.data.data; // Ambil data riwayat
        this.filteredRiwayatList = [...this.riwayatList];
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

  searchQuery: string = '';
  searchRiwayat() {
    this.filteredRiwayatList = this.riwayatList.filter(riwayat =>
      riwayat.customer_payment_detail.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      riwayat.customer_payment_method.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      riwayat.created_date.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }
}
