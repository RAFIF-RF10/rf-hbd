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

  constructor() {}

  ngOnInit() {
    this.fetchRiwayat(); // Panggil fungsi untuk fetch data saat komponen dimuat
  }

  async fetchRiwayat() {
    this.isLoading = true; // Tampilkan indikator loading
    this.errorMessage = ''; // Reset pesan error

    try {
      const response = await CapacitorHttp.get({
        url: 'https://epos.pringapus.com/api/v1/Riwayat/getRiwayat', // URL endpoint
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

}
