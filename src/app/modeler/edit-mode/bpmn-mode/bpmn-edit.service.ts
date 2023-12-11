import {EventEmitter, Injectable, Output} from '@angular/core';
import BpmnPalletteModule from 'bpmn-js/lib/features/palette';
import * as BpmnJS from 'bpmn-js/dist/bpmn-modeler.production.min.js';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {ModelService} from '../../services/model.service';
import {SelectedTransitionService} from '../../selected-transition.service';
import {CanDeactivate, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {DataGroup, DataVariable, ImportService, PetriNet as PetriflowPetriNet} from '@netgrif/petriflow';
import CamundaExtensionModule from 'camunda-bpmn-moddle/resources/camunda.json';
import camundaModdleDescriptors from 'camunda-bpmn-moddle/resources/camunda.json';
import {BpmnPropertiesPanelModule, BpmnPropertiesProviderModule, CamundaPlatformPropertiesProviderModule} from 'bpmn-js-properties-panel';
import { EditModeComponent } from '../edit-mode.component';
import CustomContextPadProvider from './customModules/custom-context-pad-provider';
import {map, subscribeOn} from 'rxjs/operators';
import {from, Observable, Subscription} from 'rxjs';
// import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';
import PaletteProvider from 'bpmn-js/lib/features/palette/PaletteProvider';
// import CustomRules from './customModules/customRules';

const basicBpmn = `<?xml version="1.0" encoding="UTF-8"?>
    <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_0xcv3nk" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Camunda Modeler" exporterVersion="3.0.0-dev">
      <bpmn:process id="Process_0sckl64" isExecutable="true">
        <bpmn:startEvent id="StartEvent_1" />
      </bpmn:process>
      <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_0sckl64">
          <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
            <dc:Bounds x="200" y="300" width="36" height="36" />
          </bpmndi:BPMNShape>
        </bpmndi:BPMNPlane>
      </bpmndi:BPMNDiagram>
    </bpmn:definitions>`

@Injectable({
  providedIn: 'root'
})
export class BpmnEditService implements CanDeactivate<EditModeComponent>{
    private _modeler: BpmnModeler
    private _isBpmnModeActive: boolean
    private _bpmnTaskIds: Array<string>

    @Output() private importDone: EventEmitter<any> = new EventEmitter();

    constructor(private http: HttpClient,
                private modelService: ModelService,
                private transitionService: SelectedTransitionService,
                private router: Router,
                private _snackBar: MatSnackBar,
                private importService: ImportService) {

        // PALLETTE RESTRICTIONS
        // Petriflow language doesn't contain subprocesses,
        const _getPaletteEntries = PaletteProvider.prototype.getPaletteEntries;
        PaletteProvider.prototype.getPaletteEntries = function (element) {
            const entries = _getPaletteEntries.apply(this);
            delete entries['create.subprocess-expanded'];
            delete entries['create.group'];
            return entries;
        };

        this._isBpmnModeActive = false
        this._modeler = new BpmnModeler({
            additionalModules: [
                BpmnPropertiesPanelModule,
                BpmnPropertiesProviderModule
                // BpmnPalletteModule,
                // CustomRules
            ],
        });
        const contextPad = this._modeler.get('contextPad');
        const translate = this._modeler.get('translate');
        const eventBus = this._modeler.get('eventBus');
        const create = this._modeler.get('create');
        const elementFactory = this._modeler.get('elementFactory');
        const customContextPadProvider = new CustomContextPadProvider(contextPad, create, elementFactory, translate, eventBus);
        this._modeler.importXML(basicBpmn)
    }

    replaceItemID(array, newID) {
        const itemIndex = this.bpmnTaskIds.findIndex(itemId => itemId === newID);

        if (itemIndex !== -1) {
            array[itemIndex].id = newID;
        }
    }

    getBpmnTaskIds(bpmnString:string): Array<string> {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(bpmnString, 'text/xml');

        // Define the BPMN namespace for XPath
        const namespace = {
            bpmn: 'http://www.omg.org/spec/BPMN/20100524/MODEL'
        };

        const taskIds = []

        const xPathQueries = ['bpmn:task', 'bpmn:userTask', 'bpmn:serviceTask']
        xPathQueries.forEach(taskType => {
            const taskTypeElements = xmlDoc.getElementsByTagName(taskType)
            // tslint:disable-next-line:prefer-for-of
            for(let i = 0; i < taskTypeElements.length; i++) {
                taskIds.push(taskTypeElements[i].getAttribute('id'))
            }
        })
        return taskIds
    }

    updatePetriflowTaskId(changedElementId: string) {

        const newBpmnTaskIds = this.getBpmnTaskIds(this.getBpmnString())
        if(newBpmnTaskIds.length === 0) {
            return
        }

        if(this.bpmnTaskIds !== undefined) {
            if(this.bpmnTaskIds.find(el => el === changedElementId)) {
                return
            }
        } else {
            this.bpmnTaskIds = newBpmnTaskIds
            return
        }
        if (this.bpmnTaskIds.length < newBpmnTaskIds.length) {
            this.bpmnTaskIds = newBpmnTaskIds
            return
        }
        const removedIds = this.bpmnTaskIds.filter(id => !newBpmnTaskIds.includes(id))
        if(removedIds.length === 1) {
            const oldTransitionId = removedIds[0] + '_t'
            if (this.modelService.model.getTransitions().map(t => t.id).includes(oldTransitionId)) {
                console.log('Transiton id found...')
                const changedTransition = this.modelService.model.getTransitions().find(it => it.id === oldTransitionId)
                console.log('Got the transition, setting new Id to: ', changedElementId + '_t')
                changedTransition.id = changedElementId + '_t'
            }
        }
        this.bpmnTaskIds = newBpmnTaskIds
    }

    async canDeactivate(component: EditModeComponent): Promise<boolean> {
        try {
            const result = await this.convertCurrentBpmn();
            return result;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    get bpmnTaskIds () {
        return this._bpmnTaskIds
    }

    set bpmnTaskIds(ids: Array<string>) {
        this._bpmnTaskIds = ids
    }

    get modeler() {
        return this._modeler
    }

  set modeler(modeler: BpmnModeler) {
      this._modeler = modeler
  }

  isActionRegistered(eventName){
      return this._modeler.get('eventBus')._listeners[eventName] !== undefined;
  }

  getBpmnString() {
        return this.modeler.get('moddle').toXML(this.modeler.getDefinitions(), { format: false }).__zone_symbol__value.xml
  }

  async convertCurrentBpmn() {
        const bpmnXmlString = this.getBpmnString()
        console.log('new BPMN model string: ', bpmnXmlString)

        try {
            // const response = await this.http.post('https://bpmn2pn.netgrif.cloud/bpmn2pn/', bpmnXmlString, {
            const response = await this.http.post('http://localhost:8064/bpmn2pn/', bpmnXmlString, {
                headers: {
                    'Content-Type': 'text/xml;charset=US-ASCII',
                },
                responseType: 'text'
            }).toPromise()
            const petriNetResult = this.importService.parseFromXml(response);
            this.updateNewModelData(petriNetResult.model)
            return true
        } catch (error) {
            this._snackBar.open(error.message, 'X');
            return false
        }
      //// this.http.post('https://bpmn2pn.netgrif.cloud/bpmn2pn/', bpmnXmlString, {
      //   this.http.post('http://localhost:8064/bpmn2pn/', bpmnXmlString, {
      //       headers: {
      //           'Content-Type': 'text/xml;charset=US-ASCII',
      //       },
      //       responseType: 'text'
      //   }).pipe().subscribe( value => {
      //       console.log('new PN model string: ', value)
      //       const petriNetResult = this.importService.parseFromXml(value);
      //       this.updateNewModelData(petriNetResult.model)
      //   }, (error: HttpErrorResponse) => {
      //       this._snackBar.open(error.message, 'X');
      //   });
    }
    updateNewModelData(newPnModel: PetriflowPetriNet) {
        if(this.modelService.isEmptyModel()) {
            this.modelService.model = newPnModel.clone()
            return
        }
        if(this.modelService.model === newPnModel) {
            return
        }
        const newTransitionIds = newPnModel.getTransitions().map(t => t.id)
        const oldPetriNetModel = this.modelService.model.clone()
        const mappingTupleIds = []
        oldPetriNetModel.getMappings().forEach(oldM => {
            const foundNewMapping = newPnModel.getMappings().find(newM => newM.transitionRef === oldM.transitionRef)
            if(foundNewMapping) {
                mappingTupleIds.push(oldM.id, foundNewMapping.id)
            }
        })
        const oldTransitionsInNewModel = oldPetriNetModel.getTransitions().filter( t => newTransitionIds.includes(t.id))
        this.modelService.model = newPnModel.clone()

        oldPetriNetModel.getDataSet().forEach(it => {
            this.modelService.model.addData(it.clone())
        })
        oldPetriNetModel.getCaseEvents().forEach(it => {
            this.modelService.model.addCaseEvent(it.clone())
        })
        oldPetriNetModel.getProcessEvents().forEach(it => {
            this.modelService.model.addProcessEvent(it.clone())
        })
        oldPetriNetModel.functions.forEach(it => {
            this.modelService.model.addFunction(it.clone())
        })
        oldTransitionsInNewModel.forEach(it => {
            const newModelTrans = this.modelService.model.getTransition(it.id)
            // copy data
            const clonedDataGroups: Array<DataGroup> = []
            it.dataGroups.forEach(g => clonedDataGroups.push(g))
            newModelTrans.dataGroups = clonedDataGroups
            // copy events
            it.getEvents().forEach(e => newModelTrans.addEvent(e.clone()))
        })

        mappingTupleIds.forEach(m => {
            this.modelService.model.removeMapping(m[0])
            this.modelService.model.addMapping(m[1])
        })
        console.log('updated PN with latest BPMN Model')
    }

  get isBpmnModeActive() {
        return this._isBpmnModeActive
  }

  set isBpmnModeActive(value: boolean) {
        this._isBpmnModeActive = value
  }

  getBpmnModel(): Promise<string> {
      return new Promise((resolve, reject) => {
          this.modeler.saveXML({format: true}, (err, xml) => {
              if (err) {
                  console.error('Could not save BPMN 2.0 diagram', err);
                  reject(err)
              } else {
                  console.log('BPMN 2.0 diagram saved as XML', xml);
                  resolve(xml)
              }
          })
      })
  }

  importXml(bpmnFileString: string) : Subscription {
        return this.importDiagram(bpmnFileString).pipe(map(result => result.warnings)).subscribe(
            (warnings) => {
                console.log('importing BPMN...')
                this.bpmnTaskIds = this.getBpmnTaskIds(bpmnFileString)

                this.importDone.emit({
                    type: 'success',
                    warnings
                })
            },
            (error) => {
                this.importDone.emit({
                    type: 'error',
                    error
                })
            }
        )
    }

  importDiagram(bpmnFileString: string): Observable<{warnings: Array<any>}> {
        return from(this.modeler.importXML(bpmnFileString) as Promise<{warnings: Array<any>}>);
  }
}
