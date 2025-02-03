import { Component, OnInit } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { Router } from '@angular/router';

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

  constructor(public router: Router) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const storedUserData = localStorage.getItem('user_data');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData);
      this.username = this.userData.userData.username;
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

  async saveChanges() {
    if (this.password !== this.confirmPassword) {
      console.log('Passwords do not match');
      return;
    }

    if (this.username && this.password) {
      const data = {
        id: this.userData.userData.id,
        username: this.username,
        password: this.password,
      };

      try {
        const response = await CapacitorHttp.post({
          url: 'https://epos.pringapus.com/api/v1/Authentication/updateUser',
          data: data,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 200) {
          this.userData.userData.username = this.username;
          localStorage.setItem('user_data', JSON.stringify(this.userData));
          this.isEditing = false;
          this.router.navigate(['tab/profile']);
          console.log('Profile updated successfully');
        } else {
          console.error('Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    } else {
      console.log('Please fill in all fields');
    }
  }

  logout() {
    // Ambil data user sebelum logout
    const user = JSON.parse(localStorage.getItem('user_data') || '{}');
    const username = user?.userData?.username;

    // Simpan keranjang user saat ini
    if (username) {
      const cartItems = localStorage.getItem('cartItems');
      if (cartItems) {
        localStorage.setItem(`cart_${username}`, cartItems);
      }
    }

    // Hapus data user tetapi biarkan keranjang tetap tersimpan
    localStorage.removeItem('user_data');
    localStorage.removeItem('cartItems'); // Hapus cartItems global agar user lain tidak mendapatkannya
    sessionStorage.clear();

    // Redirect ke halaman login
    this.router.navigate(['/login']).then(() => {
      location.reload();
    });
}



}
