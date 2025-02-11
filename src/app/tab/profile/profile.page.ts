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
  paymentMethods: { code: string; name: string; isDisabled: boolean }[] = [
    { code: 'CA', name: 'Cash', isDisabled: false },
    { code: 'TF', name: 'Transfer', isDisabled: false },
    { code: 'DC', name: 'Debit Card', isDisabled: false },
    { code: 'Qris', name: 'Qris', isDisabled: false }
  ];

  selectedMethods: string[] = [];

  constructor(public router: Router) {}

  ngOnInit() {
    this.loadUserData();
    // this.loadPaymentMethods();
    this.checkIfAlreadySelected();
  }

  // loadPaymentMethods() {
  //   this.paymentMethods = [
  //     { code: 'CA', name: 'Cash' },
  //     { code: 'TF', name: 'Transfer' },
  //     { code: 'DC', name: 'Debit Card' },
  //     { code: 'Qris', name: 'Qris' }
  //   ];

  //   // Cek metode pembayaran yang sudah ada di database
  //   if (this.userData && this.userData.userData.payment_method) {
  //     this.selectedMethods = this.userData.userData.payment_method.split(',');

  //     // Disable metode yang sudah ada
  //     this.paymentMethods.forEach(method => {
  //       (method as any).isDisabled = this.selectedMethods.includes(method.code);
  //     });
  //   }
  // }

  checkIfAlreadySelected() {
    if (this.userData && this.userData.userData.payment_method) {
      this.selectedMethods = this.userData.userData.payment_method.split(',');

      // Update setiap metode pembayaran yang sudah ada di database
      this.paymentMethods.forEach(method => {
        method.isDisabled = this.selectedMethods.includes(method.code);
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

  async savePaymentMethods() {
    if (!Array.isArray(this.selectedMethods)) {
      console.error('Error: selectedMethods bukan array!', this.selectedMethods);
      return;
    }

    const formattedMethods = this.selectedMethods.join(','); // Gabungkan array jadi string "CA,TF"

    const data = {
      outlet_code: this.userData.userData.outlet_code,
      payment_method: formattedMethods,
    };

    try {
      const response = await CapacitorHttp.post({
        url: 'https://epos.pringapus.com/api/v1/Outlets/updatePaymentMethod',
        data: data,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response API:', response);

      if (response.status === 200) {
        this.userData.userData.payment_method = formattedMethods;
        localStorage.setItem('user_data', JSON.stringify(this.userData));
        console.log('Metode pembayaran berhasil diperbarui:', formattedMethods);

        // ✅ Setelah berhasil kirim, disable checkbox & tombol
        this.disableSelection = true;
      } else {
        console.error('Gagal memperbarui metode pembayaran:', response);
      }
    } catch (error) {
      console.error('Error saat menyimpan metode pembayaran:', error);
    }
  }

  // Tambahkan variabel untuk menonaktifkan input setelah dikirim
  disableSelection: boolean = false;


  toggleMethod(methodCode: string, isChecked: boolean) {
    if (this.selectedMethods.length >= this.paymentMethods.length && isChecked) {
      console.log('Semua metode pembayaran sudah dipilih. Tidak bisa memilih lagi.');
      return;
    }

    if (isChecked) {
      if (!this.selectedMethods.includes(methodCode)) {
        this.selectedMethods.push(methodCode);
      }
    } else {
      this.selectedMethods = this.selectedMethods.filter(m => m !== methodCode);
    }
    console.log('Selected Methods:', this.selectedMethods);
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

  openProfileEdit() {
    this.profileEdit = !this.profileEdit;
  }
}
