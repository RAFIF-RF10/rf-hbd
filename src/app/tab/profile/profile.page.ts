import { Component, OnInit } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';

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
  isEditing: boolean = false; // Untuk menampilkan atau menyembunyikan form edit

  constructor() {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const storedUserData = localStorage.getItem('user_data');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData);
      this.username = this.userData.userData.username;
      this.password = ''; // Kosongkan password untuk keamanan
    } else {
      console.log('No user data found in localStorage');
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing; // Toggle antara form edit tampil atau tidak
  }

  async saveChanges() {
    if (this.username || this.password) {
      const data = {
        id: this.userData.userData.id, // Pastikan ID user dikirim
        username: this.username || this.userData.userData.username, // Tetap gunakan username lama jika tidak diubah
        password: this.password, // Password baru jika diinput
      };

      try {
        const response = await CapacitorHttp.post({
          url: 'https://epos.pringapus.com/api/v1/Authentication/updateUser', // Ganti dengan URL API yang sesuai
          data: data,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('API Response:', response);

        if (response.status === 200) {
          // Update localStorage jika berhasil
          if (this.username) {
            this.userData.userData.username = this.username;
          }

          localStorage.setItem('user_data', JSON.stringify(this.userData));
          this.isEditing = false; // Sembunyikan form setelah menyimpan
          console.log('Profile updated successfully');
        } else {
          console.error('Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    } else {
      console.log('Please fill in at least one field');
    }
  }
}
