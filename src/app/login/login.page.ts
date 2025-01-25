import { Component } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { Router } from '@angular/router'; // Import Router

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
  showPassword: boolean = false;
  showRegisterForm: boolean = false;
  fullName: string = '';
  email: string = '';
  registerPassword: string = '';
  showRegisterPassword: boolean = false;

  constructor(private router: Router) {} // Tambahkan Router di sini

  // ... Fungsi lainnya tetap sama

  Login() {
    if (!this.outlet_code || !this.username || !this.password) {
      alert('Form harus diisi dengan lengkap');
      return;
    }

    const data = {
      outlet_code: this.outlet_code,
      username: this.username,
      password: this.password,
    };

    CapacitorHttp.post({
      url: 'https://epos.pringapus.com/api/v1/Authentication/getUserLogin',
      data: data,
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response: any) => {
        console.log('Response:', response); // Log response untuk debugging

        try {
          if (response.status === 200) {
            const userData = response.data.data;
            const userLevel = parseInt(userData?.users_level, 10); // Pastikan tipe data angka
            console.log(userData);

            if (userLevel !== undefined) {
              switch (userLevel) {
                case 1:
                  alert('Login sukses sebagai admin');
                  break;
                case 2:
                  alert('Login sukses sebagai penjual');
                  break;
                case 3:
                  alert('Login sukses sebagai pembeli');
                  break;
                default:
                  alert('Login sukses sebagai user lain');
                  break;
              }

              // Simpan data pengguna ke localStorage
              localStorage.setItem('user_data', JSON.stringify(userData));

              // Arahkan ke halaman home
              this.router.navigate(['/tab/home']); // Tambahkan ini
            } else {
              alert('Data tidak lengkap atau level tidak valid');
            }
          } else {
            alert('Gagal login: ' + (response.data?.message || 'Unknown error'));
          }
        } catch (error: any) {
          console.error('Error processing response:', error);
          alert('Error parsing response: ' + error.message);
        }
      })
      .catch((error: any) => {
        console.error('HTTP request error:', error);
        alert('Kesalahan dalam melakukan permintaan: ' + error.message);
      });
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
  }

  // Fungsi lainnya tetap sama
}
