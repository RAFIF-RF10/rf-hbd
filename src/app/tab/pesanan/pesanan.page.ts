import { Component, OnInit } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-pesanan',
  templateUrl: './pesanan.page.html',
  styleUrls: ['./pesanan.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PesananPage implements OnInit {
  campaigns: any[] = []; // ✅ Menyimpan daftar kampanye
  customers: any[] = []; // ✅ Menyimpan daftar pelanggan
  id_outlet = "1";

  newCampaign = {
    id_outlet: this.id_outlet,
    name: '',
    description: '',
    phone_list: '',
    date_campign: ''
  };

  constructor() {}

  ngOnInit() {
    this.getCampaignList();
    this.getCampaignCustomerList(); // ✅ Ambil daftar pelanggan saat halaman dimuat
  }

  // ✅ GET: Mengambil daftar pelanggan kampanye
  async getCampaignCustomerList() {
    try {
      const response = await CapacitorHttp.post({
        url: 'https://epos.pringapus.com/api/v1/campaign/getCampignCustomerList',
        headers: { 'Content-Type': 'application/json' },
        params: { id_outlet: this.id_outlet },
      });

      if (response.data.status) {
        this.customers = response.data.data;
      } else {
        console.log('No customers found');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }

  // ✅ GET: Mengambil daftar kampanye
  async getCampaignList() {
    try {
      const response = await CapacitorHttp.post({
        url: 'https://epos.pringapus.com/api/v1/campaign/getCampignList',
        headers: { 'Content-Type': 'application/json' },
        params: { id_outlet: this.id_outlet },
      });

      if (response.data.status) {
        this.campaigns = response.data.data;
      } else {
        console.log('No campaigns found');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  }

  // ✅ POST: Menambahkan kampanye baru
  async addCampaign() {
    if (!this.newCampaign.name || !this.newCampaign.description || !this.newCampaign.date_campign) {
      alert('Harap isi semua kolom!');
      return;
    }

    try {
      const response = await CapacitorHttp.post({
        url: 'https://epos.pringapus.com/api/v1/campaign/addCampignList',
        headers: { 'Content-Type': 'application/json' },
        data: this.newCampaign,
      });

      if (response.data.status) {
        alert('Kampanye berhasil ditambahkan!');
        this.getCampaignList(); // ✅ Refresh daftar kampanye setelah menambah
        this.resetForm(); // ✅ Reset form input setelah berhasil
      } else {
        alert('Gagal menambahkan kampanye.');
      }
    } catch (error) {
      console.error('Error adding campaign:', error);
      alert('Terjadi kesalahan saat menambahkan kampanye.');
    }
  }

  // ✅ Reset form setelah menambahkan kampanye
  resetForm() {
    this.newCampaign = {
      id_outlet: this.id_outlet,
      name: '',
      description: '',
      phone_list: '',
      date_campign: ''
    };
  }
}
