import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';



@Component({
  selector: 'app-tab',
  templateUrl: './tab.page.html',
  styleUrls: ['./tab.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, IonicModule, RouterModule],
})
export class TabPage implements OnInit {



  ngOnInit() {
  }

  constructor(private router: Router) {}

  ngAfterViewInit() {
    const tabs = document.querySelectorAll('ion-tab-button');

    const updateActiveTab = () => {
      const currentUrl = this.router.url; // Dapatkan URL saat ini
      tabs.forEach(tab => {
        if (currentUrl.includes(tab.getAttribute('tab') ?? '')) { // ✅ FIX ERROR
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
    };

    updateActiveTab(); // Set tab aktif saat aplikasi dibuka

    this.router.events.subscribe(() => {
      updateActiveTab(); // Update tab aktif setiap kali halaman berubah
    });
  }


}
