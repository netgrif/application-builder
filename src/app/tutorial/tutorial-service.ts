import {Injectable} from '@angular/core';
import {MortgageService} from '../modeler/mortgage.service';
import {Router} from '@angular/router';
import {TutorialStep} from './tutorial-step';
import {ModelService} from '../modeler/services/model/model.service';
import {ActionsModeService} from '../modeler/actions-mode/actions-mode.service';
import {TransitionActionsTool} from '../modeler/actions-mode/tools/transition-actions-tool';
import {RoleActionsTool} from '../modeler/actions-mode/tools/role-actions-tool';

@Injectable({
    providedIn: 'root'
})
export class TutorialService {

    welcome: TutorialStep;
    demo: TutorialStep;
    youtube: TutorialStep;
    github: TutorialStep;
    mortgage: TutorialStep;
    modeler: TutorialStep;
    simulator: TutorialStep;
    roleEditor: TutorialStep;
    dataEditor: TutorialStep;
    actions: TutorialStep;
    i18n: TutorialStep;
    bug: TutorialStep;
    steps: Array<string>;
    onClose: () => void;
    mortgageLoaded: boolean;

    constructor(
        private mortgageService: MortgageService,
        private router: Router,
        private modelService: ModelService
    ) {
        this.welcome = TutorialStep.of(
            'welcome',
            'Welcome to the Netgrif Application Builder',
            'Netgrif Application Builder (NAB) is the tool for building process driven applications using Petriflow language. NAB is composed of several modules that help you in different stages of application development.',
            () => {
                this.mortgageLoaded = false;
                if (modelService.model.getTransitions().length === 0 && modelService.model.getPlaces().length === 0 && modelService.model.getArcs().length === 0 &&
                    modelService.model.getDataSet().length === 0 && modelService.model.getTransactions().length === 0 && modelService.model.getRoles().length === 0) {
                    this.mortgageService.loadModel();
                    this.mortgageLoaded = true;
                }
                this.router.navigate(['/modeler']);
            },
            () => {
            },
            'center'
        );
        this.modeler = TutorialStep.of(
            'modeler',
            'Process Modeler',
            'In Process Modeler you can model business processes by defining tasks and their routing. As a modelling formalism for processes Petriflow language uses Petri nets that consist of state variables, tasks and their interconnections. It supports import of processes in BPMN 2.0 and its automatic translation into Petri nets.',
            () => {
                this.router.navigate(['/modeler/simulation']);
            },
            () => {
                this.onClose();
            },
            'right'
        );
        this.simulator = TutorialStep.of(
            'simulator',
            'Process Simulation',
            'In Process Simulation you can simulate modeled processes by executing sequences of tasks or task events.',
            () => {
                this.router.navigate(['/modeler/data']);
            },
            () => {
                this.router.navigate(['/modeler']);
            },
            'right'
        );
        this.dataEditor = TutorialStep.of(
            'dataEditor',
            'Data Editor',
            'In Data Editor you can define data variables used in the processes. Petriflow supports all types of data variables you will need for your application, including text, numbers, date, datetime, enumerations and choices, files, images and many others. Validation and initial values of the data variables can be easily specified in Petriflow. Petriflow supports reference to a list of tasks as a data type.',
            () => {
                this.router.navigate(['/modeler/roles']);
            },
            () => {
                this.router.navigate(['/modeler/simulation']);
            },
            'right'
        );
        this.roleEditor = TutorialStep.of(
            'roleEditor',
            'Role Editor',
            'In Role Editor you can define roles and specify which roles can perform tasks in the process.',
            () => {
                this.router.navigate(['/modeler/actions']);
            },
            () => {
                this.router.navigate(['/modeler/data']);
            },
            'right'
        );
        this.actions = TutorialStep.of(
            'actions',
            'Actions Editor',
            'In Action Editor you can program reactions on events of process instances, its tasks and data fields. Actions use Groovy as a programming language. Types of events that you can catch includes construction of the process instance, assignment of a task to a user, cancellation of a task, finish  of a task, and change of a data field value. In actions that react on events, you can trigger events in different process instances and in this way for example create a new instance when you finish a task, to assign a new task to a user when you finish actual task, to recalculate a value of a data field whenever you change another data field, or hide/show data fields when you change another data field. In actions you can use search functions to find specific process instances or tasks based on values of process attributes, process instance attributes, task attributes and data variables. In actions you can also call external functions as well as to send and receive data from external systems via rest or soap web services.',
            () => {
                this.onClose();
            },
            () => {
                this.router.navigate(['/modeler/roles']);
            },
            'right'
        );
        this.i18n = TutorialStep.of(
            'i18n',
            'Internationalization',
            'You can add translations for different languages.',
            () => {
            },
            () => {
            },
            'right'
        );
        this.demo = TutorialStep.of(
            'demo',
            'Demo Application',
            'You can deploy your Petriflow models in our demo application after registration.',
            () => {
            },
            () => {
            },
            'right'
        );
        this.youtube = TutorialStep.of(
            'youtube',
            'Netgrif Academy',
            'Educational videos and tutorials can be found on our Youtube channel.',
            () => {
            },
            () => {
            },
            'right'
        );
        this.github = TutorialStep.of(
            'github',
            'Netgrif Github',
            'Source codes of our community products are available on Github.',
            () => {
            },
            () => {
            },
            'right'
        );
        this.mortgage = TutorialStep.of(
            'mortgage',
            'Mortgage demo process',
            'To load a Mortgage demo process click here.',
            () => {
            },
            () => {
            },
            'right'
        );
        this.bug = TutorialStep.of(
            'bug',
            'Bug report',
            'You can use our service desk to report any bug you encounter.',
            () => {
            },
            () => {
            },
            'right'
        );
        this.steps = [
            this.welcome.step,
            this.modeler.step,
            this.simulator.step,
            this.dataEditor.step,
            this.roleEditor.step,
            this.actions.step,
            this.i18n.step,
            this.demo.step,
            this.youtube.step,
            this.github.step,
            this.mortgage.step,
            this.bug.step
        ];
        this.onClose = () => {
            this.router.navigate(['/modeler']);
            if (this.mortgageLoaded) {
                this.modelService.model = this.modelService.newModel();
            }
        };
    }
}
