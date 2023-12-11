import {Component, HostListener} from '@angular/core';
import {LanguageService} from '@netgrif/components-core';
import {MatDialog} from '@angular/material/dialog';
import {DialogConfirmComponent} from './dialogs/dialog-confirm/dialog-confirm.component';
import {JoyrideService} from 'ngx-joyride';
import {TutorialService} from './tutorial/tutorial-service';
import {MortgageService} from './modeler/mortgage.service';
import {Router} from '@angular/router';

@Component({
  selector: 'nab-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Netgrif Application Builder';

  @HostListener('window:beforeunload', ['$event'])
  WindowBeforeUnload($event: any) {
    $event.returnValue = 'Your data will be lost!';
  }

  constructor(
    private router: Router,
    private _languageService: LanguageService,
    private matDialog: MatDialog,
    private readonly joyrideService: JoyrideService,
    private _mortgageService: MortgageService,
    private tutorialService: TutorialService,
  ) {
  }

  addMortgage() {
    const dialogRef = this.matDialog.open(DialogConfirmComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this._mortgageService.loadModel();
        this.router.navigate(['/modeler']);
      }
    });
  }

  help() {
    this.joyrideService.startTour({
      steps: this.tutorialService.steps,
      themeColor: '#0f4c81dd',
    });
  }

  get tutorial() {
    return this.tutorialService;
  }
}
