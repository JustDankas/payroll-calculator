import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-info-dialog',
  imports: [MatDividerModule],
  templateUrl: './info-dialog.component.html',
  styleUrl: './info-dialog.component.scss',
})
export class InfoDialogComponent {
  @ViewChild('container', { static: true })
  container!: ElementRef<HTMLDivElement>;
}
