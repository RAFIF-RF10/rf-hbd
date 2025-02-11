import { Component } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { AlertController } from '@ionic/angular';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  outlet_code: string = '';
  username: string = '';
  password: string = '';
  fullName: string = '';
  email: string = '';
  registerPassword: string = '';
  deviceToken: string = '';
  showRegisterPassword: boolean = false;
  showPassword: boolean = false;
  showRegisterForm: boolean = false;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private alertController: AlertController,
  ) {
    this.getDeviceToken();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  async getDeviceToken() {
    const info = await Device.getId();
    this.deviceToken = info.identifier;
  }

  async Login() {
    if (!this.outlet_code || !this.username || !this.password) {
      this.presentAlert('Perhatian', 'Form harus diisi dengan lengkap');
      return;
    }

    const data = {
      outlet_code: this.outlet_code,
      username: this.username,
      password: this.password,
      device_token: this.deviceToken,
    };

    try {
      const response: any = await CapacitorHttp.post({
        url: 'https://epos.pringapus.com/api/v1/Authentication/getUserLogin',
        data: data,
        headers: { 'Content-Type': 'application/json' },
      });

      console.log(response);

      if (response.status === 200) {
        const userData = response.data.data;

        if (response.data.forceLogout) {
          const newDeviceToken = this.deviceToken; // Simpan device token baru

          const alert = await this.alertController.create({
            header: 'Peringatan',
            message: 'Akun ini sedang digunakan di perangkat lain. Apakah Anda ingin melogout perangkat sebelumnya?',
            buttons: [
              {
                text: 'Tidak',
                role: 'cancel',
                handler: () => {
                  console.log('User membatalkan login');
                },
              },
              {
                text: 'Ya, Logout Perangkat Lama',
                handler: async () => {
                  try {
                    // Kirim request logout
                    await CapacitorHttp.post({
                      url: 'https://epos.pringapus.com/api/v1/Authentication/forceLogout',
                      headers: { 'Content-Type': 'application/json' },
                      data: { device_token: userData.deviceToken }, // Logout perangkat lama
                    });

                    console.log('Perangkat lama berhasil logout.');

                    // Setelah logout berhasil, panggil login ulang dengan token baru
                    this.deviceToken = newDeviceToken; // Pulihkan token baru sebelum login ulang
                    this.Login();
                  } catch (err) {
                    console.error('Error saat force logout:', err);
                    this.presentAlert('Error', 'Gagal logout perangkat lama.');
                  }
                },
              },
            ],
          });

          await alert.present();
          return;
        }


        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('access_token', userData.accessToken);
        localStorage.setItem('device_token', userData.deviceToken);

        this.router.navigate(['/tab/home']);
      } else {
        this.presentAlert('Gagal Login', 'Gagal login: ' + (response.data?.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('HTTP request error:', error);
      this.presentAlert('Error', 'Kesalahan dalam melakukan permintaan: ' + error.message);
    }
  }

  async forceLogout(deviceToken: string) {
    try {
      await CapacitorHttp.post({
        url: 'https://epos.pringapus.com/api/v1/Authentication/forceLogout',
        data: { device_token: deviceToken },
        headers: { 'Content-Type': 'application/json' },
      });

      localStorage.clear();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Gagal logout perangkat lama:', error);
    }
  }

  ionViewWillEnter() {
    setInterval(async () => {
      const currentDeviceToken = localStorage.getItem('device_token');
      const response = await CapacitorHttp.post({
        url: 'https://epos.pringapus.com/api/v1/Authentication/checkDeviceToken',
        data: { device_token: currentDeviceToken },
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.data.valid) {
        this.presentAlert('Sesi Berakhir', 'Silahkan login kembali.');
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    }, 5000);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleRegisterPasswordVisibility() {
    this.showRegisterPassword = !this.showRegisterPassword;
  }
  // Fungsi untuk membuka form registrasi
  openRegisterForm() {
    this.showRegisterForm = true;
  }

  // Fungsi untuk menutup form registrasi
  closeRegisterForm() {
    this.showRegisterForm = false;
  }

  // Fungsi untuk menangani pendaftaran user
  register() {
    // Logic untuk registrasi user
    console.log('User registered:', this.fullName, this.email, this.registerPassword);
    this.router.navigate(['register']);
  }

  // Fungsi lainnya tetap sama
}
