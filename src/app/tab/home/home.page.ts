import { Component, OnInit, ViewChild } from '@angular/core';
import { IonModal, IonRouterOutlet } from '@ionic/angular';
import { Router } from '@angular/router';
import { CartService } from 'src/app/services/cart.service';
import { CapacitorHttp } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { StorageService } from 'src/app/storage.service';
import { Filesystem, Directory } from '@capacitor/filesystem';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  @ViewChild('itemModal') itemModal!: IonModal;
  @ViewChild('addItemModal') addItemModal!: IonModal;
  @ViewChild(IonRouterOutlet, { static: true }) ionRouterOutlet!: IonRouterOutlet;

  selectedFilter: string = 'All';
  selectedItem: any = null;
  qty: number = 1;
  cartCount: number = 0;
  searchQuery: string = '';

  items: any[] = [];
  filteredItems: any[] = [];
  categories: any[] = [];
  categoriesList: any[] = [];

  itemData: {
    id_category : string;
    name        : string;
    description : string;
    price       : string;
    photo       : string | undefined;
  } = {
    id_category : '',
    name        : '',
    description : '',
    price       : '0',
    photo       : '',
  };

  id_outlet: string = '';
  outlet_name: string = '';

  constructor(public router: Router, private cartService: CartService, private storageService: StorageService) { this.router.events.subscribe(() => {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras.state && navigation.extras.state['deletedItemId']) {
      this.removeDeletedItem(navigation.extras.state['deletedItemId']);
    }
  });}

  ngOnInit() {
    this.getCategories();
    this.getListCategories();
    this.getItems();


    this.cartService.cartItems$.subscribe((items) => {
      this.cartCount = items.length;
    });

    this.id_outlet    = this.storageService.getOutletId();
    this.outlet_name  = this.storageService.getOutletCode();
  }

  async getListCategories() {
    try {
      const response = await CapacitorHttp.get({
        url: 'https://epos.pringapus.com/api/v1/Product_category/getProductCategoryList',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (Array.isArray(response.data.data)) {
        this.categoriesList = response.data.data;
      } else {
        console.error('Data kategori tidak dalam format array:', response.data.data);
      }
    } catch (error) {
      console.error('Terjadi kesalahan saat mengambil kategori:', error);
    }
  }

  async getCategories() {
    try {
      const response = await CapacitorHttp.get({
        url: 'https://epos.pringapus.com/api/v1/Product_category/getProductCategoryList',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (Array.isArray(response.data.data)) {
        console.log('Kategori berhasil diambil:', response.data.data); // Cek data kategori
        this.categories = response.data.data;
        this.categories.unshift({ id: 'All', name: 'All' }); // Menambahkan kategori 'All'
      } else {
        console.error('Data kategori tidak dalam format array:', response.data.data);
      }
    } catch (error) {
      console.error('Terjadi kesalahan saat mengambil kategori:', error);
    }
  }

  // Fungsi untuk mengambil data produk dari API
  async getItems() {
    try {
      const response = await CapacitorHttp.get({
        url: 'https://epos.pringapus.com/api/v1/Product_category/get_products',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (Array.isArray(response.data)) {
        console.log('Produk berhasil diambil:', response.data);
        this.items = response.data;
        this.filteredItems = [...this.items];
      } else {
        console.error('Data produk tidak dalam format array:', response.data);
      }
    } catch (error) {
      console.error('Terjadi kesalahan saat mengambil produk:', error);
    }
  }

  openModal(item: any) {
    this.selectedItem = item;
    this.qty = 1;

    if (this.itemModal) {
      this.itemModal.present().catch((error) => {
        console.error('Error saat membuka modal:', error);
      });
    } else {
      console.error('Modal belum diinisialisasi');
    }
  }
removeDeletedItem(id: string) {
  this.items = this.items.filter(item => item.id !== id);
  this.filteredItems = [...this.items]; // Update tampilan langsung
}

  addToCart() {
    if (this.selectedItem) {
      this.cartService.addToCart(this.selectedItem, this.qty);
      if (this.itemModal) {
        this.itemModal.dismiss();
      }
    }
  }

  openDetailPage(item: any) {
    this.selectedItem = item;
    this.router.navigate(['/detail'], { state: { item } });
  }

  incrementQty() {
    this.qty += 1;
  }

  selectFilter(filter: string) {
    this.selectedFilter = filter;

    if (filter === 'All') {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter((item) => item.id_category === filter);
    }
  }

  decrementQty() {
    if (this.qty > 1) {
      this.qty -= 1;
    }
  }

  calculateTotal(): number {
    return this.selectedItem ? this.selectedItem.price * this.qty : 0;
  }


  // Fungsi untuk menangani perubahan pencarian produk
  onSearchChange(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredItems = this.items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) &&
        (this.selectedFilter === 'All' || item.category_id === this.selectedFilter)
    );
  }

  /////////////jangan dihapuscommentnya
  //  source: CameraSource.Prompt
  //  source: CameraSource.Photos
  /////////////jangan dihapuscommentnya
  async choosePhoto() {
    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Photos
        });

        if (image.webPath) {
            await this.uploadImage(image);
        }
    } catch (error) {
        console.error('Error memilih gambar:', error);
    }
  }
// const resizedBlob = await this.resizeImage(blob, 500, 500);
async uploadImage(image: any) {
  try {
      const response = await fetch(image.webPath!);
      const blob = await response.blob();
      const resizedBlob = await this.resizeImage(blob, 500, 500);
      const fileType = resizedBlob.type || 'image/jpeg';

      if (fileType !== 'image/jpeg' && fileType !== 'image/jpg' && fileType !== 'image/png') {
          console.error('Format gambar tidak didukung. Harap unggah file JPG atau PNG.');
          return;
      }

      // const fileName = `Img_${Date.now()}.${fileType.split('/')[1]}`;
      const fileName = `Img_${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('id_outlet', this.id_outlet);
      formData.append('outlet_name', this.outlet_name);

      const uploadResponse = await fetch('https://epos.pringapus.com/api/v1/Product_category/uploadImage', {
          method: 'POST',
          body: formData
      });

      const result = await uploadResponse.json();
      console.log('Response dari upload:', result);

      if (result.status) {
          console.log('Gambar berhasil diunggah:', result.file_url);
          this.itemData.photo       = result.file_url;
      } else {
          console.error('Gagal mengunggah gambar:', result.message);
      }

  } catch (error) {
      console.error('Error saat mengunggah gambar:', error);
  }
}


  async resizeImage(blob: Blob, width: number, height: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            canvas.toBlob((resizedBlob) => {
                if (resizedBlob) {
                    resolve(resizedBlob);
                } else {
                    reject(new Error('Gagal mengubah ukuran gambar'));
                }
            }, blob.type);
        };

        img.onerror = (err) => reject(err);
        img.src = URL.createObjectURL(blob);
    });
  }

  async addProduct() {
    const formData = {
        id_outlet   : this.id_outlet,
        id_category : this.itemData.id_category,
        name        : this.itemData.name,
        description : this.itemData.description,
        price       : this.itemData.price,
        img_url     : this.itemData.photo
    };

    console.log('data request ser'+formData);
    try {
        const response = await CapacitorHttp.post({
            url: 'https://epos.pringapus.com/api/v1/product_category/addProduct',
            headers: { 'Content-Type': 'application/json' },
            data: formData
        });

        const result = response.data;
        console.log('Response dari API:', response.data);
        if (result.status) {
            console.log('Produk berhasil ditambahkan');
            this.getCategories();
            this.getListCategories();
            this.getItems();
            this.itemData.id_category = '';
            this.itemData.name        = '';
            this.itemData.description = '';
            this.itemData.price       = '';
            this.itemData.photo       = '';
            this.addItemModal.dismiss();
        } else {
            console.error('Gagal menambahkan produk:', result.message);
        }
    } catch (error) {
        console.error('Error saat menambahkan produk:', error);
    }
  }

  async deleteProduct(id: string) {
    if (!id) {
      console.error('ID produk tidak ditemukan');
      return;
    }

    console.log("Menghapus produk dengan ID:", id);

    const userConfirm = window.confirm("Apakah Anda yakin ingin menghapus produk ini?");
    if (!userConfirm) return;

    try {
      const response = await CapacitorHttp.post({
        url: `https://epos.pringapus.com/api/v1/Product_category/deleteProduct/${id}`, // ID di URL
        headers: { 'Content-Type': 'application/json' }
      });

      console.log("Response dari server:", response);

      if (response.data.status) {
        console.log('Produk berhasil dihapus');
        this.router.navigate(['tab/home'], { state: { deletedItemId: id } });
      } else {
        console.error('Gagal menghapus produk:', response.data.message);
      }
    } catch (error) {
      console.error('Error saat menghapus produk:', error);
    }
  }


  openAddItemModal() {
    if (this.addItemModal) {
      this.addItemModal.present();
    }
  }

  closeAddItemModal() {
    this.addItemModal.dismiss();
  }

  setDefaultImage(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/image-not-found.png';
  }

  closePhoto() {
    this.itemData.photo = undefined;
  }

}
