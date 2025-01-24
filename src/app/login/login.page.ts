import { Component } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';

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

  constructor() {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleRegisterPasswordVisibility() {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  noValidation(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    if (isNaN(parseInt(event.key))) {
      event.preventDefault();
    }
  }

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
        Authorization: 'Bearer your_jwt_or_token_here',
        'Content-Type': 'application/json',
      },
    })
      .then((response: any) => {
        if (response.status === 200) {
          if (response.data.level === 'user') {
            localStorage.setItem('user_data', JSON.stringify(response.data.user_data));
            alert('Login sukses sebagai user');
          } else if (response.data.level === 'admin') {
            alert('Login sukses sebagai admin');
          } else {
            alert('Level user tidak valid');
          }
        } else {
          alert('Gagal login: ' + (response.data.message || 'Unknown error'));
        }
      })
      .catch((error: any) => {
        console.error(error);
        alert('Kesalahan dalam melakukan permintaan: ' + error.message);
      });
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
}
