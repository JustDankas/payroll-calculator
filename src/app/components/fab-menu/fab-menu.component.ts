import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { InfoDialogComponent } from '../info-dialog/info-dialog.component';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';

@Component({
  selector: 'app-fab-menu',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    SettingsDialogComponent,
  ],
  templateUrl: './fab-menu.component.html',
  styleUrl: './fab-menu.component.scss',
})
export class FabMenuComponent {
  isOpen = false;

  constructor(private dialog: MatDialog) {}

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  openSettingsDialog(): void {
    this.dialog.open(SettingsDialogComponent);
  }

  openInfoDialog(): void {
    this.dialog.open(InfoDialogComponent, {
      autoFocus: false, // 👈 This stops Material from scrolling down to focus an element
    });
  }
}
