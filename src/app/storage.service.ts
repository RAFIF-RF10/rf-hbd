import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() {}

  getUserData() {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }

  getId() {
    const data = this.getUserData();
    return data ? data.userData?.id : null;
  }


  getAccessToken() {
    const data = this.getUserData();
    return data ? data.accessToken : null;
  }

  getOutletId() {
    const data = this.getUserData();
    return data ? data.userData.id_outlet : null;
  }

  getMembershipLevel() {
    const data = this.getUserData();
    return data ? data.userData.member_level : null;
  }

  getPhoneNumber() {
    const data = this.getUserData();
    return data ? data.userData.phone : null;
  }

  getUserName() {
    const data = this.getUserData();
    return data ? data.userData.username : null;
  }
}
