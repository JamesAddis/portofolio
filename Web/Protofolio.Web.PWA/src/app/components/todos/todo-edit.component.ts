import{Subscription} from "rxjs/Subscription";
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';

import { AbstractTodoComponent } from "./abstract-todo.component";

import {ToDoReadModel} from "./../../models/ToDoReadModel";
import { ToDoObjectiveReadModel } from "./../../models/ToDoObjectiveReadModel";
import { ToDoSubObjectiveReadModel } from "./../../models/ToDoSubObjectiveReadModel";
import {IToDoInputModel} from "./../../models/ToDoInputModel";


import {ILogger, LoggerService} from "./../../services/todo.logger.service";
import {IToDoService, ToDoService} from "./../../services/todo.service";

export class ToDoEditComponent extends AbstractTodoComponent{
    /**
     * Private Members
     */
    private readonly logger:ILogger;
    private readonly service:IToDoService;

    /**
     * Private Fields
     */
    private routeDataSubscription:Subscription;
    private statusUpdateSubscription:Subscription;
    private getPageDetailsSubscription:Subscription;
    private submitSubscription:Subscription;
    private updateSubscriptions:Subscription[]= [];

    /**
     * Public Fields
     */
    public model:ToDoReadModel;

    public formGroup:FormGroup;


    public get deleteUrl():string{
        return `/todos/delete/${this.model.id}`;
    }

    public get formUrl():string{
        return `/todos/edit/${this.model.id}`;
    }

    public get id(){
        return this.model.id;
    }

    public get lastModified(){
        return this.model.dateUpdated;
    }

    public get lastModifiedBy(){
        return this.model.userUpdatedID;
    }

    public get created(){
        return this.model.dateCreated;
    }

    public get createdBy(){
        return this.model.userCreatedID;
    }

    /**
     * Add Objective Click event handler
     * @param $event
     */
    public addObjective($event){
        let sub = this.service.addObjective(this.id, this.lastModified)
        .subscribe(
        ()=>{},
        err=>{
            if(typeof err ==='object' && Object.keys(err).some(x=>x == "status")) {
                switch(err.status){
                    case 404:
                    case 410:
                        this.dialog 
                    case 0:
                    case 400:
                    case 401:
                    case 403:
                    case 406:
                    case 408:
                    case 503:
                    case 500:
                    default:        
                }
            }
             
            if(typeof err !== 'undefined'){

            }   
        
        },
        ()=>{this.subscriptions = this.updateSubscriptions.filter(x=> x !== sub);});
        this.subscriptions.push(sub);
        return super.addObjective($event);
    }

    /**
     * Remove Objective Click event handler
     * @param index 
     * @param $event
     */
    public removeObjective(index:number,$event){
        // request deletion of objective
        let sub = this.service
            .removeObjective(this.id, index)
            .subscribe(()=>{

            },err=>{
                switch(err.status){
                    case 0: break;
                    case 401: break;
                    case 403: break;
                    case 404: break;
                    case 408: break;
                    case 410: break;
                    case 500: break;
                    default: break;
                }
            },()=>{ this.updateSubscriptions = this.updateSubscriptions.filter(x=>x !== sub); });
        return super.removeObjective(index, $event);
    }

    /**
     * Name Change Event Handler
     * @param $event event
     */
    public nameChange($event){
        // clear validation errors for name
        if(this.nameValidationMessagesSet){
            this.validationErrors = this.validationErrors.filter(x=>x.name != `Name`);
        }
    }

    /**
     * Summary Change Event Handler
     * @param $event event
     */
    public summaryChange($event){
        // clear validation errors for summary
        if(this.summaryValidationMessagesSet){
            this.validationErrors = this.validationErrors.filter(x=>x.name != `Summary`);
        }
        //request summary update
        let sub = this.service
            .updateTodo({summary:this.summary})
            .subscribe(()=>{},
            err=>{},
            ()=>{ this.updateSubscriptions = this.updateSubscriptions.filter(x=>x!== sub); });
    }

    /**
     * Route resolved data
     * @param resolvedData resolved data
     */
    public routeDataSuccess(resolvedData){
        this.model = resolvedData.model;
        this.inputModel =  Object.assign(new ToDoReadModel(), resolvedData.inputs || resolvedData.model);

        if(resolvedData.message){
            this.message = resolvedData.message;
            let msgType= "";
            switch(resolvedData.messageType){
                case "success":
                    msgType= "text-success";
                    break;
                case "error":
                    msgType ="text-danger";
                    break;
                case "warning":
                    msgType="text-warning";
                    break;
                case "info":
                    msgType = "text-info";
                    break;
            }
            this.messageClass= msgType;
        } 
        this.statusUpdateSubscription =this.service
            .getEvents(this.id)
            .subscribe($event=> this.statusUpdate($event),
            err=>this.statusUpdateError(err),
            ()=>{ this.statusUpdateSubscription = null; });
        this.status = "active";
    }

    /**
     * Router data error response
     * @param err error
     */
    public routeDataError(err){
        if(typeof err === 'object'){
            this.errorPage(err.title, err.message, err.link);
        } else{
            this.router.navigate("/error", {skipLocationChange:true});
        }
    }

    /**
     * Submit Event handler
     * @param $event form submit event
     */
    public submit($event){
        $event.stopPropogation();
        // update todo
        this.updateToDo();
        return false;
    }

    /**
     * Component initialiser
     */
    public ngOnInit(){
        // get route data
        this.routeDataSubscription = this.router
        .data
        .subscribe(resolvedData=>{this.routeDataSuccess(resolvedData);},
         err=> {this.routeDataError(err);},
         ()=>{this.routeDataSubscription = null;});
    }

    /**
     * Component Deconstructor
     */
    public ngOnDestroy(){
        if(typeof this.routeDataSubscription !== 'undefined' 
        && this.routeDataSubscription instanceof Subscription){
            this.routeDataSubscription.unsubscribe();
        }
        if(typeof this.statusUpdateSubscription !== 'undefined' 
        && this.statusUpdateSubscription instanceof Subscription){
            this.statusUpdateSubscription.unsubscribe();
        }
        if(typeof this.getPageDetailsSubscription !== 'undefined' 
        && this.getPageDetailsSubscription instanceof Subscription){
            this.getPageDetailsSubscription.unsubscribe();
        }
        if(typeof this.submitSubscription !== 'undefined' 
        && this.submitSubscription instanceof Subscription){
            this.submitSubscription.unsubscribe();
        }
    }

    /**
     * Update To do event
     */
    public updateToDo(){
        // set as updating
        this.status ="updating";
        // clear message and validation errors
        this.message ="";
        this.messageClass = "";
        this.validationErrors =[];

        // submit todo to update
        this.submitSubscription = this.service
            .update(this.id, this.inputModel, this.lastModified)
            .subscribe((result:ToDoReadModel | null)=>{
                // set message details
                this.message = "Successfully updated todo";
                this.messageClass ="text-success";
                
                if(result instanceof ToDoReadModel){
                    // update todo read model
                    this.model = result;
                    this.inputModel = Object.assign({}, result);
                    this.status = "active";
                } else{
                    // reload todo
                    this.reloadModel();
                }
            }, err=>{
                switch(err.status){
                    case 0:
                    case 408:
                    case 422:
                        this.message = err.message;
                        this.messageClass = "text-warning";
                        this.validationErrors =err.validationErrors;
                        this.reloadModel();
                        break;
                    case 401:
                        this.router.navigate("/unauthorised", {skipLocationChange:true});
                        break;
                    case 403:
                        this.router.navigate("/forbidden", {skipLocationChange:true});
                        break;
                    case 404:
                    case 410:
                        this.errorPage(err.title, err.message);
                        break;
                    case 409:
                    case 412:
                        this.message = err.message;
                        this.messageClass = "text-warning";
                        this.validationErrors =err.validationErrors;
                        this.reloadModel();
                        break;
                    case 500:
                    default:
                        this.message =err.message;
                        this.messageClass = "text-danger";
                        this.status= "active";
                        break;
                }
            }, ()=> {this.submitSubscription = null;});
    }

    public statusUpdate($event){
        switch($event.type){
            case "Updated":
                // update main details
                this.model.summary =$event.data.summary;
                this.model.title = $event.data.title;
                
                // set last modified details
                this.model.dateUpdated= $event.data.dateUpdated;
                this.model.userUpdatedID = $event.data.username;
                break;
            case "ObjectiveAdded":
                // add objective details
                this.model.objectives.push(new ToDoObjectiveReadModel($event.data));
                
                // set last modified details
                this.model.dateUpdated= $event.data.dateUpdated;
                this.model.userUpdatedID = $event.data.username;
                break;
            case "ObjectiveUpdated":
                let objectiveReadModel = this.model.objectives[$event.data.objectiveIndex-1];
                // update relevant objective details
                objectiveReadModel.title = $event.data.title;
                objectiveReadModel.summary = $event.data.summary;
                objectiveReadModel.complete = $event.data.complete;

                // set last modified details
                this.model.dateUpdated = $event.data.dateUpdated;
                this.model.userUpdatedID = $event.data.username;
                break;
            case "ObjectiveRemoved":
                // remove relevant objective
                this.model.objectives.splice($event.data.objectiveIndex -1,1);

                // set last modified details
                this.model.dateUpdated= $event.data.dateUpdated;
                this.model.userUpdatedID = $event.data.username;
                break;
            case "SubObjectiveAdded":
                // add sub objective to relevant todo objective
                this.model
                    .objectives[$event.data.objectiveIndex-1]
                    .subObjectives
                    .push(new ToDoSubObjectiveReadModel($event.data));

                // set last modified details
                this.model.dateUpdated= $event.data.dateUpdated;
                this.model.userUpdatedID = $event.data.username;
                break;
            case "SubObjectiveUpdated":
                let subObjectiveReadModel = this.model
                .objectives[$event.data.objectiveIndex-1]
                .subObjectives[$event.data.subobjectiveIndex -1];

                // update relevant sub objective
                subObjectiveReadModel.title = $event.data.title;
                subObjectiveReadModel.summary = $event.data.summary;
                subObjectiveReadModel.complete = $event.data.complete;
                
                // set last modified details
                this.model.dateUpdated = $event.data.dateUpdated;
                this.model.userUpdatedID = $event.data.username;
                break;
            case "SubObjectiveRemoved":
                // remove relevant sub objective
                this.model
                .objectives[$event.data.objectiveIndex-1]
                .subObjectives
                .splice($event.data.subobjectiveIndex -1,1);
                
                // set last modified details
                this.model.dateUpdated = $event.data.dateUpdated;
                this.model.userUpdatedID = $event.data.username;
                break;
            case "Deleted":
                // set as deleted status
                this.status = "deleted";
                break;
            case "UndoEvent":
                // reload details to get relevant details
                this.reloadPage();
                break;
            default:
                break;
        }
    }
}