import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { CapacitorHttp } from '@capacitor/core';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-edit-membership',
  templateUrl: './edit-membership.page.html',
  styleUrls: ['./edit-membership.page.scss'],
  standalone: false,
})
export class EditMembershipPage implements OnInit {

  id: string = '';
  id_outlet: string = '';
  username: string = '';
  membership: string = '';
  packages: any[] = [];
  outlets: any[] = [];
  paymentMethod: string = '';
  cardType: string = '';
  cardNumber: string = '';
  paymentId: string = '';
  isPaid: boolean = false;
  selectedPackage: any = null;
  isModalOpen = false;
  currentRightValue: number = 0;

  constructor(
    public router: Router,
    private storageService: StorageService,
    private renderer: Renderer2,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.id = this.storageService.getUserData()?.userData?.id || '';
    this.username = this.storageService.getUserName() || '';
    this.id_outlet = this.storageService.getOutletId() || '';
    console.log(this.id_outlet);
    this.membership = this.storageService.getMembershipLevel() || '';
    this.loadPackages();
    this.loadOutlets();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  openModal(packageName: string) {
    const packageData = this.packages.find(pkg => pkg.name === packageName);
    if (packageData) {
      this.selectedPackage = packageData;
      this.isModalOpen = true;
    } else {
      this.presentAlert('Package Not Found', 'The selected package could not be found.');
    }
  }

  loadPackages() {
    CapacitorHttp.get({
      url: 'https://epos.pringapus.com/api/v1/Authentication/getPackages',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response: any) => {
        if (response.data.status) {
          this.packages = response.data.data;
        } else {
          this.presentAlert('Error', 'Failed to load packages.');
        }
      })
      .catch((err) => {
        console.error(err);
        this.presentAlert('Error', 'Error fetching packages.');
      });
  }

  selectPackage(pkgName: string) {
    this.selectedPackage = this.packages.find((pkg) => pkg.name === pkgName);

    if (!this.selectedPackage) {
      this.presentAlert('Package Not Found', 'The selected package could not be found.');
      return;
    }

    if (this.selectedPackage.name === this.membership) {
      this.presentAlert('Info', 'You already have this package.');
      return;
    }

    console.log('Selected Package:', this.selectedPackage);
    this.isPaid = false;
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
        this.presentAlert('Error', 'Error fetching outlets.');
      });
  }

  payForPackage() {
    if (!this.paymentMethod) {
      this.presentAlert('Warning', 'Please select a payment method.');
      return;
    }

    if (this.paymentMethod === 'creditCard' && !this.cardNumber) {
      this.presentAlert('Warning', 'Please enter your card number.');
      return;
    }

    if ((this.paymentMethod === 'paypal' || this.paymentMethod === 'dana') && !this.paymentId) {
      this.presentAlert('Warning', 'Please enter your Payment ID.');
      return;
    }

    if (!this.selectedPackage || !this.selectedPackage.id) {
      this.presentAlert('Error', 'No package selected or invalid package.');
      return;
    }

    this.presentAlert('Success', 'Payment Successful!');
    this.isPaid = true;

    CapacitorHttp.post({
      url: 'https://epos.pringapus.com/api/v1/Authentication/updateMembership',
      headers: { 'Content-Type': 'application/json' },
      data: {
        id: this.id_outlet,
        member_level: this.selectedPackage.id,
      },
    })
      .then((response: any) => {
        if (response.data && response.data.status) {
          this.presentAlert('Success', 'Membership updated successfully.');

          let userData = JSON.parse(localStorage.getItem('user_data') || '{}');
          if (userData && userData.userData) {
            userData.userData.member_level = this.selectedPackage.id;
            userData.userData.membership_name = this.selectedPackage.name;
            localStorage.setItem('user_data', JSON.stringify(userData));

            this.closeModal();
          }
        } else {
          this.presentAlert('Error', 'Failed to update membership.');
        }
      })
      .catch((error) => {
        console.error('Error updating membership:', error);
        this.presentAlert('Error', 'Error updating membership.');
      });
  }

  private updateSliderPosition() {
    const sliders = document.querySelectorAll('.slider-container') as NodeListOf<HTMLElement>;
    sliders.forEach((slider) => {
      this.renderer.setStyle(slider, 'right', `${this.currentRightValue}%`);
    });
  }

  closeModal() {
    this.isModalOpen = false;
  }

  moveRight() {
    if (this.currentRightValue < 200) {
      this.currentRightValue += 100;
      this.updateSliderPosition();
    }
  }

  moveLeft() {
    if (this.currentRightValue > 0) {
      this.currentRightValue -= 100;
      this.updateSliderPosition();
    }
  }

  getName(pkgName: string): string {
    const pkg = this.packages.find(p => p.name === pkgName);
    return pkg ? pkg.name : undefined;
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