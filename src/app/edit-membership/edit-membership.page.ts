import { Component, OnInit ,Renderer2} from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { CapacitorHttp } from '@capacitor/core';

@Component({
  selector: 'app-edit-membership',
  templateUrl: './edit-membership.page.html',
  styleUrls: ['./edit-membership.page.scss'],
  standalone: false,
})
export class EditMembershipPage implements OnInit {

  id: string                  = '';
  id_outlet: string           = '';
  username: string            = '';
  membership: string          = '';
  packages: any[]             = [];
  outlets: any[]              = [];
  paymentMethod: string = ''; // Pilihan metode pembayaran
  cardType: string = ''; // Pilihan tipe kartu kredit
  cardNumber: string = ''; // Nomor kartu kredit
  paymentId: string = ''; // ID untuk PayPal atau Dana
  isPaid: boolean = false;
  selectedPackage: any = null;
  constructor(public router: Router, private storageService: StorageService,private renderer: Renderer2 ) { }

    ngOnInit() {
      this.id = this.storageService.getUserData()?.userData?.id || '';

      this.username   = this.storageService.getUserName() || '';
      this.id_outlet  = this.storageService.getOutletId() || '';
      console.log( this.id_outlet );
      this.membership = this.storageService.getMembershipLevel() || '';
      this.loadPackages();
      this.loadOutlets();
    }


// openModal(pkg: any) {
//   this.selectedPackage = pkg;
//   this.isModalOpen = true;
// }
openModal(packageName: string) {
  const packageData = this.packages.find(pkg => pkg.name === packageName);
  if (packageData) {
    this.selectedPackage = packageData;
    this.isModalOpen = true; // Menampilkan modal pembayaran
  } else {
    alert('Paket tidak ditemukan');
  }
}



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

  selectPackage(pkgName: string) {
    this.selectedPackage = this.packages.find((pkg) => pkg.name === pkgName);

    if (!this.selectedPackage) {
      alert('Paket tidak ditemukan');
      return;
    }

    if (this.selectedPackage.name === this.membership) {
      alert('Anda sudah menggunakan paket ini');
      return;
    }

    console.log('Paket yang dipilih:', this.selectedPackage);
    this.isPaid = false; // Reset status pembayaran
  }


  loadOutlets() {
    CapacitorHttp.post({
      url: 'https://epos.pringapus.com/api/v1/Authentication/getoutlet',
      headers: { 'Content-Type': 'application/json' },
      data: { id_outlet: this.id_outlet },
    })
      .then((response: any) => {
        this.outlets = response.data.data || [];
      })
      .catch((error) => {
        console.error('Error fetching outlets:', error);
      });
  }
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

    if (!this.selectedPackage || !this.selectedPackage.id) {
      alert('No package selected or invalid package');
      return;
    }

    // Simulasi pembayaran berhasil
    alert('Payment Successful!');
    this.isPaid = true; // Tandai pembayaran berhasil

    // Kirimkan ID paket dan nama membership ke API
    CapacitorHttp.post({
      url: 'https://epos.pringapus.com/api/v1/Authentication/updateMembership',
      headers: { 'Content-Type': 'application/json' },
      data: {
        id: this.id_outlet, // Gunakan id user, bukan hanya id_outlet jika diperlukan
        member_level: this.selectedPackage.id,
      },
    })
      .then((response: any) => {
        if (response.data && response.data.status) {
          alert('Membership updated successfully');

          // Update member_level di localStorage
          let userData = JSON.parse(localStorage.getItem('user_data') || '{}');
          if (userData && userData.userData) {
            userData.userData.member_level = this.selectedPackage.id;
            userData.userData.membership_name = this.selectedPackage.name;
            localStorage.setItem('user_data', JSON.stringify(userData));

            // Arahkan ke halaman profile
            this.router.navigate(['/tab/profile']);
          }
        } else {
          alert('Failed to update membership');
        }
      })
      .catch((error) => {
        console.error('Error updating membership:', error);
        alert('Error updating membership');
      });
  }




  private updateSliderPosition() {
    const sliders = document.querySelectorAll('.slider-container') as NodeListOf<HTMLElement>;
    sliders.forEach((slider) => {
      this.renderer.setStyle(slider, 'right', `${this.currentRightValue}%`);
    });
  }
  isModalOpen = false;

  // openModal() {
  //   this.isModalOpen = true;
  // }

  closeModal() {
    this.isModalOpen = false;
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


  getName(pkgName: string): string {
    const pkg = this.packages.find(p => p.name === pkgName);
    return pkg ? pkg.name : undefined ;
  }

  getPrice(pkgName: string): number {
    const pkg = this.packages.find(p => p.name === pkgName);
    return pkg ? pkg.price : 0;
  }


  getSalePrice(pkgName: string): number {
    const pkg = this.packages.find(p => p.name === pkgName);
    return pkg ? pkg.sale_price : 0;
  }

}
