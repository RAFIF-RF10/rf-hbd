import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AlertController } from '@ionic/angular';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

@Component({
  selector: 'app-riwayat',
  templateUrl: './riwayat.page.html',
  styleUrls: ['./riwayat.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  providers: [File, FileOpener]
})
export class RiwayatPage {
  riwayatList: any[] = [];
  filteredRiwayatList: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  id_outlet: string = '';
  selectedDate: string = '';
  isDateSelected: boolean = false;
  isDownloadButtonVisible: boolean = true;

  constructor(
    private alertController: AlertController,
    private file: File,
    private fileOpener: FileOpener
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.fetchRiwayat();
  }
  ionViewWillEnter() {
    this.loadUserData();
    this.fetchRiwayat();

    // 🔥 Cek apakah perlu refresh setelah pembayaran
    if (localStorage.getItem('refresh_riwayat') === 'true') {
      this.fetchRiwayat();
      localStorage.removeItem('refresh_riwayat'); // Hapus flag setelah refresh
    }
  }
  loadUserData() {
    const storedUserData = localStorage.getItem('user_data');

    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      this.id_outlet = userData.userData.id_outlet;
    } else {
      this.presentAlert('Error', 'No user data found in localStorage');
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID').format(amount).replace(/,/g, '.');
  }

  async fetchRiwayat() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await CapacitorHttp.get({
        url: `https://epos.pringapus.com/api/v1/Riwayat/getRiwayat/${this.id_outlet}`,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.status) {
        this.riwayatList = response.data.data;
        this.filteredRiwayatList = [...this.riwayatList];
      } else {
        this.errorMessage = response.data.message || 'Data tidak ditemukan.';
        this.presentAlert('Error', this.errorMessage);
      }
    } catch (error) {
      this.errorMessage = 'Terjadi kesalahan saat memuat data.';
      console.error(error);
      this.presentAlert('Error', this.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  filterRiwayatByDate() {
    if (!this.selectedDate) {
      this.filteredRiwayatList = [...this.riwayatList];
      return;
    }

    const formattedDate = this.selectedDate.split('T')[0];
    this.filteredRiwayatList = this.riwayatList.filter(
      riwayat => riwayat.created_date === formattedDate
    );
  }

  exportToExcel() {
    if (this.filteredRiwayatList.length === 0) {
      this.presentAlert('Perhatian', 'Tidak ada data untuk diekspor!');
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(
        this.filteredRiwayatList.map(item => {
          const paymentDetail = item.customer_payment_detail || '';
          const nameMatch = paymentDetail.match(/^[^(]+/);
          const quantityMatch = paymentDetail.match(/\d+/);

          return {
            Tanggal: item.created_date,
            'Nama Barang': nameMatch ? nameMatch[0] : 'Tidak ada nama barang',
            Jumlah: quantityMatch ? quantityMatch[0] : 'Tidak ada jumlah',
            'Metode Pembayaran': this.getPaymentMethod(item.customer_payment_method),
            'Total Pembayaran': this.formatCurrency(Number(item.customer_payment_total)),
          };
        })
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Transaksi');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });

      const fileName = `Riwayat_Transaksi_${this.selectedDate || 'Semua'}.xlsx`;
      this.saveToDevice(blob, fileName);

      this.isDownloadButtonVisible = true;
      this.isDateSelected = false;
    } catch (error) {
      console.error('Gagal membuat file Excel:', error);
      this.presentAlert('Error', 'Gagal membuat file Excel!');
    }
  }

  private async saveToDevice(blob: Blob, fileName: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = await this.convertBlobToBase64(blob);
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });

        this.presentAlert('Sukses', 'File berhasil disimpan di: ' + savedFile.uri);

        this.fileOpener.open(savedFile.uri, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } catch (error) {
        console.error('Gagal menyimpan file:', error);
        this.presentAlert('Error', 'Gagal menyimpan file di perangkat');
      }
    } else {
      saveAs(blob, fileName);
    }
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async showExportAlert() {
    const alert = await this.alertController.create({
      header: 'Pilih Tindakan',
      message: 'Pilih apakah Anda ingin mengunduh semua data atau memilih tanggal',
      buttons: [
        {
          text: 'Unduh Semua Data',
          handler: () => {
            this.filteredRiwayatList = [...this.riwayatList];
            this.exportToExcel();
          },
        },
        {
          text: 'Pilih Tanggal',
          handler: () => {
            this.isDownloadButtonVisible = false;
            this.isDateSelected = true;
          },
        },
      ],
    });

    await alert.present();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });

    await alert.present();
  }
////JANGAN DI RUBAHH!!!!!///
  getPaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
      CA: 'Cash',
      VA: 'Virtual Account',
      TF: 'Transfer',
      DC: 'Debit/Credit Card'
    };
    return methods[method] || 'Metode tidak dikenal';
  }

    onDateSelected() {
      this.filterRiwayatByDate(); // Filter berdasarkan tanggal yang dipilih
      this.exportToExcel(); // Ekspor data sesuai tanggal
    }

    searchQuery: string = '';
    searchRiwayat() {
      this.filteredRiwayatList = this.riwayatList.filter(riwayat =>
        riwayat.customer_payment_detail.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        riwayat.customer_payment_method.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        riwayat.created_date.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    closeDateModal() {
      this.isDateSelected = false;
    }

  }
