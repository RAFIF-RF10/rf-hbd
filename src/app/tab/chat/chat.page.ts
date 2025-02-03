import { Component } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core'
import { AlertController, ModalController } from '@ionic/angular';
import { CustomDatePage } from 'src/app/custom-date/custom-date.page';
import { StorageService } from 'src/app/storage.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: false,
})
export class ChatPage  {
  campaigns: any[]        = [];
  customer: any[]         = [];
  selectedDate: string    = '';
  isAddCampaignModalOpen  = false;
  membershipType: string | null  = null;
  id_outlet: string | null = null;

  chatData: {
    name        : string;
    description : string;
  } = {
    name        : '',
    description : '',
  };

  contactInput: string  = '';
  allContactsSelected   = false;
  startDate: string     = '';
  endDate: string       = '';

  currentPage: number      = 1;
  pageSize: number         = 10;
  isAllDataLoaded: boolean = false;
  isLoading: boolean       = false;
  page = 1;

  searchQuery: string = '';
  filteredCampaigns: any[] = [...this.campaigns];

  userSign = this.storageService

  constructor(private storageService: StorageService,private alertController: AlertController,private modalController: ModalController) {}


  ngOnInit() {

    console.log('id_outlet' + this.userSign.getOutletId());
    console.log('membership' + this.userSign.getMembershipLevel());

    this.refresh();
    this.loadCampaigns();
    this.loadContacts();
    this.filteredCampaigns = [...this.campaigns]; // Pastikan filteredCampaigns diisi saat komponen dimuat
  }

  async openDialog() {
    const membershipLevel = this.userSign.getMembershipLevel();

    if (membershipLevel != '1') {
      console.log('Harap upgrade membership ke level 2 atau lebih untuk memilih Real/Custom Time.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Pilih Pengiriman Data',
      message: 'Pengiriman Apa Yang Anda Inginkan?',
      buttons: [
        {
          text: 'Real Time',
          handler: () => {
            this.submitNewCampaign();
          }
        },
        {
          text: 'Custom Time',
          handler: async () => {
            if (membershipLevel == '1') {
              const modal = await this.modalController.create({
                component: CustomDatePage,
                componentProps: { selectedDate: this.selectedDate }
              });

              modal.onDidDismiss().then((dataReturned) => {
                if (dataReturned.data && dataReturned.data.selectedDate) {
                  this.selectedDate = dataReturned.data.selectedDate;
                  console.log('Tanggal dipilih:', this.selectedDate);
                  this.submitNewModalCampaign(this.selectedDate);
                } else {
                  console.log('Tidak ada tanggal yang dipilih.');
                }
              });

              return await modal.present();
            } else {
              console.log('Harap upgrade membership ke level 2 untuk memilih Custom Time.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openDialogSigle() {
    const membershipLevel = this.userSign.getMembershipLevel();

    if (membershipLevel != '2' && membershipLevel != '1') {
      console.log('Harap upgrade membership ke level GOLD untuk memilih Custom Time.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Pilih Pengiriman Data',
      message: 'Pengiriman Apa Yang Anda Inginkan?',
      buttons: [
        {
          text: 'Batal',
          handler: () => {
            this.refresh();
          }
        },
        {
          text: 'Custom Time',
          handler: async () => {
            if (membershipLevel == '2' || membershipLevel == '1') {
              const modal = await this.modalController.create({
                component: CustomDatePage,
                componentProps: { selectedDate: this.selectedDate }
              });

              modal.onDidDismiss().then((dataReturned) => {
                if (dataReturned.data && dataReturned.data.selectedDate) {
                  this.selectedDate = dataReturned.data.selectedDate;
                  console.log('Tanggal dipilih:', this.selectedDate);
                  this.submitNewModalCampaign(this.selectedDate);
                } else {
                  console.log('Tidak ada tanggal yang dipilih.');
                }
              });

              return await modal.present();
            } else {
              console.log('Harap upgrade membership ke level 2 untuk memilih Custom Time.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

// get kontak
  loadContacts() {
    CapacitorHttp.post({
      url: 'https://epos.pringapus.com/api/v1/campign/getCampignCustomerList',
      headers: {
        'Content-Type': 'application/json',
      },
      data: { id_outlet: this.userSign.getOutletId() },
    }).then((response) => {
      const content = response.data;

      if (content.status && Array.isArray(content.data)) {
        const uniqueContacts: { [key: string]: any } = {};

        content.data.forEach((customer: { customer_phone: string; customer_name: string; }) => {
          if (!uniqueContacts[customer.customer_phone]) {
            uniqueContacts[customer.customer_phone] = {
              number: customer.customer_phone,
              name: customer.customer_name,
              selected: false,
            };
          }
        });
        this.customer = Object.values(uniqueContacts);

        console.log("Kontak dari API (tanpa duplikat):", this.customer);
      } else {
        console.error('Gagal mendapatkan kontak:', content.message);
        alert('Gagal mengambil daftar kontak.');
      }
    }).catch((error) => {
      console.error('Error fetching contacts:', error);
      alert('Terjadi kesalahan saat mengambil daftar kontak.');
    });
  }

  refresh() {
    console.log('Testing error' + this.userSign.getOutletId());

    CapacitorHttp.post({
      url: 'https://epos.pringapus.com/api/v1/campign/getCampignList',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        id_outlet: this.userSign.getOutletId(),
        page: this.page,  // Kirim parameter halaman
        page_size: 10     // Jumlah data per halaman
      },
    }).then((response) => {
      const content = response.data;

      if (content.status) {
        const newCampaigns = content.data.map((campaign: any) => {
          return {
            ...campaign,
            phone_list: JSON.parse(campaign.phone_list || '[]'),
          };
        });

        // Gabungkan data baru dengan yang lama
        this.campaigns = [...this.campaigns, ...newCampaigns];

        // Tingkatkan halaman untuk permintaan berikutnya
        this.page++;
      } else {
        alert('No campaigns found: ' + content.message);
      }
    }).catch((error) => {
      console.error('Error fetching campaigns:', error);
      alert('Sorry, we encountered an error while fetching data. Please try again later.');
    });
  }

  loadCampaigns() {
    this.isLoading = true;
    CapacitorHttp.post({
      url: 'https://epos.pringapus.com/api/v1/campign/getCampignList',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        id_outlet: this.userSign.getOutletId(),
        page: this.currentPage,
        page_size: this.pageSize
      },
    }).then((response) => {
      const content = response.data;

      if (content.status) {

        if (this.currentPage === 1) {
          this.campaigns = content.data.map((campaign: any) => ({
            ...campaign,
            phone_list: JSON.parse(campaign.phone_list || '[]'),
          }));
        } else {
          this.campaigns = [...this.campaigns, ...content.data.map((campaign: any) => ({
            ...campaign,
            phone_list: JSON.parse(campaign.phone_list || '[]'),
          }))];
        }

        this.filterCampaigns();

        if (content.data.length < this.pageSize) {
          this.isAllDataLoaded = true;
        }
        this.isLoading = false;
      } else {
        alert('No campaigns found: ' + content.message);
      }
    }).catch((error) => {
      console.error('Error fetching campaigns:', error);
      alert('Sorry, we encountered an error while fetching data. Please try again later.');
    });
  }

  loadMoreData() {
    if (!this.isAllDataLoaded) {
      this.currentPage += 1;
      this.loadCampaigns();
    }
  }

  // checkMembership() {
  //   if (this.userSign.getMembershipLevel() === '3') {
  //     alert('Harap upgrade membership ke GOLD / Silver untuk memilih waktu!');
  //   }
  // }

  openAddCampaignModal() {
    this.loadContacts();
    this.isAddCampaignModalOpen = true;
  }

  closeAddCampaignModal() {
    this.isAddCampaignModalOpen = false;
  }

  submitNewCampaign() {
    const selectedPhones = this.customer
      .filter(contact => contact.selected)
      .map(contact => contact.number);

    if (selectedPhones.length === 0) {
      alert('Harap pilih minimal satu kontak.');
      return;
    }
    let formattedDate = '';
    const now = new Date();
      formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString().padStart(2, '0')}-${now.getDate()
        .toString().padStart(2, '0')} ${now.getHours()
        .toString().padStart(2, '0')}:${now.getMinutes()
        .toString().padStart(2, '0')}:${now.getSeconds()
        .toString().padStart(2, '0')}`;

    const body = {
      id_outlet: this.userSign.getOutletId(),
      name: this.chatData.name.trim(),
      description: this.chatData.description.trim(),
      phone_list: selectedPhones,
      date_campign: formattedDate,
    };

    if (this.chatData.name && this.chatData.description && selectedPhones.length > 0) {
      CapacitorHttp.post({
        url: 'https://epos.pringapus.com/api/v1/campign/addCampignRealTime',
        headers: { 'Content-Type': 'application/json' },
        data: body,
      }).then(() => {
        alert('Campaign berhasil ditambahkan!');
        this.chatData.name = '';
        this.chatData.description = '';
        this.refresh();
        this.closeAddCampaignModal();
      }).catch((error) => {
        console.error('Error adding campaign:', error);
        alert('Gagal menambahkan campaign.');
      });
    } else {
      alert('Form tidak boleh kosong!');
    }
  }

  // submitNewModalCampaign(selectedDate: string) {
  //   const selectedPhones = this.customer
  //     .filter(contact => contact.selected)
  //     .map(contact => contact.number);

  //   if (selectedPhones.length === 0) {
  //     alert('Harap pilih minimal satu kontak.');
  //     return;
  //   }

  //   const body = {
  //     id_outlet: this.userSign.getOutletId(),
  //     name: this.chatData.name.trim(),
  //     description: this.chatData.description.trim(),
  //     phone_list: selectedPhones,
  //     date_campign: selectedDate,
  //   };

  //   if (this.chatData.name && this.chatData.description && selectedPhones.length > 0) {
  //     CapacitorHttp.post({
  //       url: 'https://epos.pringapus.com/api/v1/campign/addCampignList',
  //       headers: { 'Content-Type': 'application/json' },
  //       data: body,
  //     }).then(() => {
  //       alert('Campaign berhasil ditambahkan!');
  //       this.chatData.name = '';
  //       this.chatData.description = '';
  //       this.refresh();
  //       this.closeAddCampaignModal();
  //     }).catch((error) => {
  //       console.error('Error adding campaign:', error);
  //       alert('Gagal menambahkan campaign.');
  //     });
  //   } else {
  //     alert('Form tidak boleh kosong!');
  //   }
  // }

  submitNewModalCampaign(selectedDate: string) {
    const selectedPhones = this.customer
      .filter(contact => contact.selected)
      .map(contact => contact.number);

    if (selectedPhones.length === 0) {
      alert('Harap pilih minimal satu kontak.');
      return;
    }

    const body = {
      id_outlet: this.userSign.getOutletId(),
      name: this.chatData.name.trim(),
      description: this.chatData.description.trim(),
      phone_list: selectedPhones,
      date_campign: selectedDate,
    };

    CapacitorHttp.post({
      url: 'https://epos.pringapus.com/api/v1/campign/addCampignList',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    }).then((response) => {
      if (response.data.status) {
        alert('Campaign berhasil ditambahkan!');
        this.chatData.name = '';
        this.chatData.description = '';
        this.refresh();
        this.closeAddCampaignModal();
      } else {
        alert(response.data.message);
      }
    }).catch((error) => {
      console.error('Error adding campaign:', error);
      alert('Gagal menambahkan campaign.');
    });
  }


  parseContacts(input: string): string[] {
    return input
      .split(',')
      .map(contact => contact.trim())
      .filter(contact => /^\d{9,15}$/.test(contact));
  }




  filterCampaigns() {
    this.filteredCampaigns = this.campaigns.filter(campaign =>
      campaign.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }


  goldPrivilege: boolean = false;
  silverPrivilege: boolean = false;
  bronzePrivilege: boolean = false;

  goldprivilege() {
    this.goldPrivilege = !this.goldPrivilege
  }

}
