import { Component, OnInit } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { StorageService } from 'src/app/storage.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {
  userData: any = null;
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  isEditing: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  paymentMethods: { code: string; name: string; isDisabled: boolean }[] = [
    { code: 'CA', name: 'Cash', isDisabled: false },
    { code: 'TF', name: 'Transfer', isDisabled: false },
    { code: 'DC', name: 'Debit Card', isDisabled: false },
    { code: 'Qris', name: 'Qris', isDisabled: false }
  ];
  disableSelection: boolean = false;

  userSign = this.storageService
  user_level: string = '';

  selectedMethods: string[] = [];

  constructor(public router: Router, private alertController: AlertController, private storageService: StorageService,) {}

  ngOnInit() {
    this.loadUserData();
    this.checkIfAlreadySelected();
    this.fetchPaymentMethods();
    this.user_level  = this.storageService.getUserLevel();
  }

  checkIfAlreadySelected() {
    if (this.userData && this.userData.userData.payment_method) {
      this.selectedMethods = this.userData.userData.payment_method.split(',');
      this.paymentMethods.forEach(method => {
        method.isDisabled = this.selectedMethods.includes(method.code);
        console.log(`Metode ${method.name} (${method.code}) disabled: ${method.isDisabled}`);
      });
    }
  }



  loadUserData() {
    const storedUserData = localStorage.getItem('user_data');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData);
      this.username = this.userData.userData.username;

      if (this.userData.userData.payment_method) {
        this.selectedMethods = this.userData.userData.payment_method.split(',');
      }
      // Pastikan metode pembayaran di-update setelah data dimuat
      this.checkIfAlreadySelected();
    } else {
      console.log('No user data found in localStorage');
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  togglePasswordVisibility(field: string) {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else if (field === 'confirmPassword') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }
  async fetchPaymentMethods() {
    const user = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (!user || !user.userData || !user.userData.outlet_code) return;


    try {
        const response = await CapacitorHttp.get({
            url: `https://epos.pringapus.com/api/v1/cart/get_payment_method/${user.userData.outlet_code}`,
            headers: { 'Content-Type': 'application/json' },
        });

        console.log('Response API:', response);

        if (response.status === 200 && response.data.status) {
            // Ambil daftar metode pembayaran yang sudah ada di database
            const existingPayments = response.data.data.payment_method ? response.data.data.payment_method.split(',') : [];

            console.log('Metode pembayaran dari API:', existingPayments); // Debugging

            // Pastikan selectedMethods hanya berisi metode yang sudah tersimpan
            this.selectedMethods = [...existingPayments];

            // Terapkan disable pada metode yang sudah ada di database
            this.paymentMethods = this.paymentMethods.map(method => {
                return {
                    ...method,
                    isDisabled: existingPayments.includes(method.code), // Kunci jika sudah ada di database
                };
            });

            console.log('Daftar metode pembayaran setelah update:', this.paymentMethods); // Debugging
// Cek apakah semua metode sudah dipilih
            this.disableSelection = this.paymentMethods.every(m => m.isDisabled);
        } else {
            console.error('Gagal mengambil metode pembayaran:', response);
        }
    } catch (error) {
        console.error('Error saat mengambil metode pembayaran:', error);
    }
}
async savePaymentMethods() {
  if (!Array.isArray(this.selectedMethods)) {
      console.error('Error: selectedMethods bukan array!', this.selectedMethods);
      return;
  }

  const formattedMethods = this.selectedMethods.join(',');

  const data = {
      outlet_code: this.userData.userData.outlet_code,
      payment_method: formattedMethods,
  };

  try {
      const response = await CapacitorHttp.post({
          url: 'https://epos.pringapus.com/api/v1/Outlets/updatePaymentMethod',
          data: data,
          headers: { 'Content-Type': 'application/json' },
      });

      console.log('Response API:', response);

      if (response.status === 200) {
          console.log('Metode pembayaran berhasil diperbarui!');

          // ✅ Ambil ulang data dari API agar metode yang dipilih langsung terdisable
          await this.fetchPaymentMethods();

          const alert = await this.alertController.create({
              header: 'Sukses',
              message: 'Metode pembayaran berhasil disimpan!',
              buttons: ['OK']
          });
          await alert.present();
      } else {
          console.error('Gagal memperbarui metode pembayaran:', response);
      }
  } catch (error) {
      console.error('Error saat menyimpan metode pembayaran:', error);
  }
}


  // Tambahkan variabel untuk menonaktifkan input setelah dikirim

  toggleMethod(code: string, isChecked: boolean) {
    if (isChecked) {
      // Tambahkan metode jika dicentang
      if (!this.selectedMethods.includes(code)) {
        this.selectedMethods.push(code);
      }
    } else {
      // Hapus metode jika tidak dicentang
      this.selectedMethods = this.selectedMethods.filter(m => m !== code);
    }

    // Cek apakah semua metode sudah dipilih
    this.disableSelection = this.paymentMethods.every(m => m.isDisabled);
  }



  togglePaymentMethod(method: string) {
    if (this.selectedMethods.length >= this.paymentMethods.length && !this.selectedMethods.includes(method)) {
      console.log('Semua metode pembayaran sudah dipilih. Tidak bisa memilih lagi.');
      return;
    }

    if (this.selectedMethods.includes(method)) {
      this.selectedMethods = this.selectedMethods.filter(m => m !== method);
    } else {
      this.selectedMethods.push(method);
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  profileEdit: boolean = false;
  addPay: boolean = false;

  openProfileEdit() {
    this.profileEdit = !this.profileEdit;
    this.addPay = false;
  }

  openAddPay() {
    this.addPay = !this.addPay
    this.profileEdit = false;
  }

}
