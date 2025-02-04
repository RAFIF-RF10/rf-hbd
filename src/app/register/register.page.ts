import { Component, OnInit, Renderer2 } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { Router } from '@angular/router'; // Import Router
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
  // otp: string = '';

  otp: string[] = ['', '', '', '', '', ''];

  isOtpVerified: boolean = false;
  isOtpSent = false;
  otpExpireTime: number = 0; // Deklarasi variabel untuk waktu kadaluarsa OTP
  otpSentTime: number = 0;  // Inisialisasi dengan 0
 // Menyimpan waktu pengiriman OTP
  otpResendCooldown: number = 60;  // Durasi cooldown 60 detik untuk kirim OTP ulang
  otpCooldownRemaining: number = 0;
  otpVerify : boolean = false;

  constructor(private renderer: Renderer2 , private router:Router) {
    this.loadPackages();
  }

  // Fungsi untuk memilih paket
  selectPackage(pkgName: string) {
  const selected = this.packages.find(pkg => pkg.name === pkgName); // Cari paket berdasarkan nama
  if (selected) {
    this.selectedPackage = selected;
    
    this.isPaid = false; // Reset status pembayaran
    console.log('Selected Package:', this.selectedPackage);
  } else {
    console.error('Package not found');
  }
}
validatePhoneNumber(event: any) {
  let input = event.target.value.replace(/[^0-9]/g, ''); // Hanya angka

  // Pastikan selalu diawali dengan 0
  if (!input.startsWith('0')) {
    input = '0' + input;
  }

  // Hindari lebih dari satu 0 di awal (contoh: "00" menjadi "0")
  input = input.replace(/^0+/, '0');

  // Batasi maksimal 15 digit
  if (input.length > 15) {
    input = input.substring(0, 15);
  }

  this.phone = input;
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
          this.packages = response.data.data; // Simpan data paket ke dalam array
        } else {
          alert('Failed to load packages');
        }
      })
      .catch((err) => {
        console.error(err);
        alert('Error fetching packages');
      });
  }


  isOpenRegister = false;

  openRegister() {
    this.isOpenRegister = true;
  }
  register() {
    if (!this.name || !this.address || !this.phone || !this.selectedPackage) {
        alert('All fields must be filled, including package selection');
        return;
    }

    console.log("Selected Package:", this.selectedPackage); // Debugging

    const data = {
        name: this.name,
        address: this.address,
        phone: this.phone,
        member_level: this.selectedPackage.id // Pastikan ambil `id` dari package
    };

    console.log("Data sent to backend:", data); // Debugging

    CapacitorHttp.post({
        url: 'https://epos.pringapus.com/api/v1/Authentication/register',
        data: data,
        headers: { 'Content-Type': 'application/json' },
    })
    .then((response) => {
        if (response.data.status) {
            alert('Registration successful! OTP sent to your phone.');

            // Simpan OTP sementara
            localStorage.setItem('otp', response.data.otp);

            this.isOtpSent = true;
            this.otpSentTime = Date.now();
            this.otpCooldownRemaining = this.otpResendCooldown;
            this.startOtpCooldown();
            // this.router.navigate(['/login']  );
        } else {
            alert(response.data.message);
        }
    })
    .catch((err) => {
        console.error(err);
        alert('Error during registration');
    });
}


  // Fungsi untuk memverifikasi OTP
  verifyOtp() {


    if (!this.otp) {
        alert('Please enter OTP');
        return;
    }

    // Ambil OTP dari localStorage untuk validasi
    const storedOtp = localStorage.getItem('otp') ?? '';

    if (this.otp.join('') !== storedOtp) {
      alert("OTP tidak cocok!");
      return;
  }

    // Lanjutkan verifikasi OTP
    const data = {
        otp: this.otp,
        phone: this.phone, // Kirimkan nomor telepon yang sudah didaftarkan
    };

    CapacitorHttp.post({
        url: 'https://epos.pringapus.com/api/v1/Authentication/verify_otp',
        data: data,
        headers: { 'Content-Type': 'application/json' },
    })
    .then((response) => {
        if (response.data.status) {
            alert('OTP verified successfully!');
            localStorage.removeItem('otp'); // Hapus OTP setelah verifikasi
            this.otpVerify = true;
        } else {
            alert(response.data.message); // Misalnya, 'User not found'
        }
    })
    .catch((err) => {
        console.error(err);
        alert('Error verifying OTP');
    });
  }

  // Fungsi untuk mengirim OTP ulang jika cooldown sudah selesai
  resendOtp() {
    if (this.otpCooldownRemaining > 0) {
      alert(`Please wait ${this.otpCooldownRemaining} seconds before requesting OTP again.`);
      return;
    }

    // Panggil kembali API untuk mengirim OTP
    CapacitorHttp.post({
        url: 'https://epos.pringapus.com/api/v1/Authentication/resend_otp',
        data: { name: this.name, address: this.address, phone: this.phone },
        headers: { 'Content-Type': 'application/json' },
    })
    .then((response) => {
      if (response.data.status) {
          alert('OTP sent to your phone again!');
          localStorage.setItem('otp', response.data.otp); // Simpan OTP baru
          this.otpSentTime = Date.now();
          this.otpCooldownRemaining = this.otpResendCooldown;
          this.startOtpCooldown();
      } else {
          alert(response.data.message);
      }
  })

    .catch((err) => {
        console.error(err);
        alert('Error sending OTP');
    });
  }

  // Mulai countdown untuk cooldown OTP
  startOtpCooldown() {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.otpSentTime) / 1000);  // Hitung detik sejak OTP dikirim
      this.otpCooldownRemaining = Math.max(0, this.otpResendCooldown - elapsed);  // Update cooldown

      if (this.otpCooldownRemaining <= 0) {
        clearInterval(interval);  // Hentikan countdown ketika cooldown selesai
      }
    }, 1000);
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

  back() {
    this.router.navigate(['login'])
  }

  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  login() {
    this.router.navigate(['login']);
  }

  moveToNext(event: any, nextInput?: HTMLInputElement) {
    const value = event.target.value;
    if (value.length === 1 && nextInput) {
      nextInput.focus();
    }
    // this.checkOTP();
  }

  handleBackspace(event: any, prevInput?: HTMLInputElement, currentInput?: HTMLInputElement) {
    if (event.key === 'Backspace' && currentInput?.value === '' && prevInput) {
      prevInput.focus();
    }
  }

}
