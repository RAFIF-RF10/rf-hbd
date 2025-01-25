import { Component, OnInit, Renderer2 } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
// import { Component, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage  {
  packages: any[] = [];
  selectedPackage: any = null;
  isPaid: boolean = false; // Kontrol pembayaran
  name: string = '';
  address: string = '';
  phone: string = '';
  paymentMethod: string = ''; // Pilihan metode pembayaran
  cardType: string = ''; // Pilihan tipe kartu kredit
  cardNumber: string = ''; // Nomor kartu kredit
  paymentId: string = ''; // ID untuk PayPal atau Dana

  constructor(private renderer: Renderer2) {
    this.loadPackages();
  }

  // Fungsi untuk memilih paket
  selectPackage(pkgName: string) {
  const selected = this.packages.find(pkg => pkg.name === pkgName); // Cari paket berdasarkan nama
  if (selected) {
    this.selectedPackage = selected; // Tetapkan paket yang dipilih
    this.isPaid = false; // Reset status pembayaran
    console.log('Selected Package:', this.selectedPackage);
  } else {
    console.error('Package not found');
  }
}

  getPrice(pkgName: string): number {
    const pkg = this.packages.find(p => p.name === pkgName);
    return pkg ? pkg.price : 0;
  }


  getSalePrice(pkgName: string): number {
    const pkg = this.packages.find(p => p.name === pkgName);
    return pkg ? pkg.sale_price : 0;
  }



  // Fungsi untuk melakukan pembayaran
  payForPackage() {
    if (!this.paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (this.paymentMethod === 'creditCard' && !this.cardNumber) {
      alert('Please enter your card number');
      return;
    }

    if ((this.paymentMethod === 'paypal' || this.paymentMethod === 'dana') && !this.paymentId) {
      alert('Please enter your Payment ID');
      return;
    }

    // Proses pembayaran - Anda bisa menambahkan logika untuk menghubungkan dengan API pembayaran
    alert('Payment Successful!');
    this.isPaid = true; // Tandai pembayaran berhasil
  }

  // Fungsi untuk mendapatkan daftar paket
  loadPackages() {
    CapacitorHttp.get({
      url: 'https://epos.pringapus.com/api/v1/Authentication/getPackages',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response: any) => {
        if (response.data.status) {
          this.packages = response.data.data;
        } else {
          alert('Failed to load packages');
        }
      })
      .catch((err) => {
        console.error(err);
        alert('Error fetching packages');
      });
  }

  // Fungsi untuk melakukan registrasi
  register() {
    if (!this.name || !this.address || !this.phone || !this.selectedPackage) {
      alert('All fields must be filled');
      return;
    }

    const data = {
      name: this.name,
      address: this.address,
      phone: this.phone,
    };

    CapacitorHttp.post({
      url: 'https://epos.pringapus.com/api/v1/Authentication/register',
      data: data,
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response: any) => {
        if (response.data.status) {
          alert('Registration successful');
        } else {
          alert(response.data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        alert('Error during registration');
      });
  }


  currentRightValue: number = 0; 

  moveRight() {
    if (this.currentRightValue < 200) {
      this.currentRightValue += 100; // Tambahkan 100% ke nilai 'right'
      this.updateSliderPosition();
    }
  }

  // Fungsi untuk menangani klik tombol kiri
  moveLeft() {
    if (this.currentRightValue > 0) {
      this.currentRightValue -= 100; // Kurangi 100% dari nilai 'right'
      this.updateSliderPosition();
    }
  }

  // Fungsi untuk memperbarui posisi slider
  private updateSliderPosition() {
    const sliders = document.querySelectorAll('.slider-container') as NodeListOf<HTMLElement>;
    sliders.forEach((slider) => {
      this.renderer.setStyle(slider, 'right', `${this.currentRightValue}%`);
    });
  }


}
