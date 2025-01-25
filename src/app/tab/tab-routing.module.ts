import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TabPage } from './tab.page';


const routes: Routes = [
  {
    path: '',
    component: TabPage,
    children: [
      {
        path: 'riwayat',
        loadChildren: () => import('./riwayat/riwayat.module').then( m => m.RiwayatPageModule)
      },
      {
        path: 'pesanan',
        loadChildren: () => import('./pesanan/pesanan.module').then( m => m.PesananPageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.module').then( m => m.ProfilePageModule)
      },
      {
        path: 'home',
        loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
      },
      {
        path: '',
        redirectTo: '/tab/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tab/home',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabPageRoutingModule {}
