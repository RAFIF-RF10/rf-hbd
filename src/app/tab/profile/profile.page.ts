import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false  

})
export class ProfilePage implements OnInit {
  userData: any = null;

  constructor() {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData);
    } else {
      console.log('No user data found in localStorage');
    }
  }
}
