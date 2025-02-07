  import { CommonModule } from '@angular/common';
  import { IonicModule } from '@ionic/angular';
  import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
  import { CapacitorHttp } from '@capacitor/core';
  import { FormsModule } from '@angular/forms';
  import * as XLSX from 'xlsx';
  import { saveAs } from 'file-saver';
  import { AlertController } from '@ionic/angular';
  import { File } from '@awesome-cordova-plugins/file/ngx';
  import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
  import { Capacitor } from '@capacitor/core';
  import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

  @Component({
    selector: 'app-riwayat',
    templateUrl: './riwayat.page.html',
    styleUrls: ['./riwayat.page.scss'],
    standalone: true, // Komponen standalone
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
    constructor(private alertController: AlertController, private file: File,private fileOpener: FileOpener) {}

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
      this.isLoading = true;
      this.errorMessage = '';

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
    filterRiwayatByDate() {
      if (!this.selectedDate) {
        this.filteredRiwayatList = [...this.riwayatList];
        return;
      }

      const formattedDate = this.selectedDate.split('T')[0];
      this.filteredRiwayatList = this.riwayatList.filter(riwayat => riwayat.created_date === formattedDate);
    }

    exportToExcel() {
      console.log('Tombol Unduh Excel ditekan!'); // Cek apakah fungsi terpanggil

      if (this.filteredRiwayatList.length === 0) {
        alert('Tidak ada data untuk diekspor!');
        console.warn('Data kosong, tidak bisa ekspor.');
        return;
      }

      console.log('Data yang akan diekspor:', this.filteredRiwayatList);

      try {
        const worksheet = XLSX.utils.json_to_sheet(
          this.filteredRiwayatList.map(item => {
            const paymentDetail = item.customer_payment_detail || '';
            const nameMatch = paymentDetail.match(/^[^(]+/);
            const quantityMatch = paymentDetail.match(/\d+/);

            return {
              'Tanggal': item.created_date,
              'Nama Barang': nameMatch ? nameMatch[0] : 'Tidak ada nama barang',
              'Jumlah': quantityMatch ? quantityMatch[0] : 'Tidak ada jumlah',
              'Metode Pembayaran': this.getPaymentMethod(item.customer_payment_method),
              'Total Pembayaran': this.formatCurrency(Number(item.customer_payment_total)), // Pastikan angka
            };
          })
        );

        const header = worksheet['!rows'] || [];
        header.push({
          hidden: false,
          hpt: 30,
          hpx: 100,
        });

        worksheet['!cols'] = [
          { wpx: 150 },
          { wpx: 200 },
          { wpx: 100 },
          { wpx: 180 },
          { wpx: 150 },
        ];

        console.log('Worksheet berhasil dibuat:', worksheet);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Transaksi');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
        });

        console.log('File siap untuk di-download.');

        // Simpan file ke perangkat
        const fileName = `Riwayat_Transaksi_${this.selectedDate || 'Semua'}.xlsx`;
        this.saveToDevice(blob, fileName);

        this.isDownloadButtonVisible = true;
        this.isDateSelected = false; // Form tanggal hilang setelah unduhan selesai
      } catch (error) {
        console.error('Gagal membuat file Excel:', error);
      }
    }

    private async saveToDevice(blob: Blob, fileName: string) {
      if (Capacitor.isNativePlatform()) {
        // Simpan file di Android/iOS
        try {
          const base64Data = await this.convertBlobToBase64(blob);
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents
          });

          alert('File berhasil disimpan di: ' + savedFile.uri);

          // Buka file setelah tersimpan
          this.fileOpener.open(savedFile.uri, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        } catch (error) {
          console.error('Gagal menyimpan file:', error);
          alert('Gagal menyimpan file di perangkat');
        }
      } else {
        // Jika di browser, gunakan file-saver
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
              this.filteredRiwayatList = [...this.riwayatList];  // Ambil semua data
              this.exportToExcel(); // Ekspor langsung
            }
          },
          {
            text: 'Pilih Tanggal',
            handler: () => {
              this.isDownloadButtonVisible = false; // Sembunyikan tombol Unduh Excel
              this.isDateSelected = true; // Tampilkan form tanggal
            }
          }
        ]
      });

      await alert.present();
    }
    onDateSelected() {
      this.filterRiwayatByDate(); // Filter berdasarkan tanggal yang dipilih
      this.exportToExcel(); // Ekspor data sesuai tanggal
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
