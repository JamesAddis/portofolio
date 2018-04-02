import{Router, ActivatedRoute} from "@angular/router";
import{Subscription} from "rxjs/Subscription";
import { FormGroup, FormControl, Validators } from '@angular/forms';

import {SessionStorageService} from "angular-web-storage";
import {IToDoService, ToDoService} from "./../../services/todo.service";
import {ILogger, LoggerService} from "./../../services/todo.logger.service";

import{ToDoReadModel} from "./../../models/ToDoReadModel";
import { ToDoSubObjectiveReadModel } from "../../models/ToDoSubObjectiveReadModel";
import { ToDoObjectiveReadModel } from "../../models/ToDoObjectiveReadModel";
import { MatDialog, MatSnackBar } from "@angular/material";
import {ErrorDialogComponent} from "./../error/error-dialog.component";
import {UnauthorisedDialogComponent} from "./../error/unauthorised-dialog.component";

/**
 * To Do Delete form component
 */
export class ToDoDeleteComponent{
    /**
     * Private Members
     */

    /**
     * Logger to report error
     */
    private readonly logger:ILogger;

    /**
     * Service to delete todo
     */
    private readonly service:IToDoService;

    /**
     * Private Fields
     */

    private routeDataSubscription:Subscription;
    private statusUpdateSubscription:Subscription;
    private getPageDetailsSubscription:Subscription;
    private submitSubscription:Subscription;
    private subscriptions:Subscription[]=[];
    
    /**
     * Public Fields
     */

    /**
     * Todo details
     */
    public model:ToDoReadModel;

    /**
     * Message details
     */
    public message:string;
    public messageClass:string;
    public errorTitle:string;
    public errorLink:string;

    public status:string= "loading";
    public validationErrors:{name:string, message:string}[] =[];

    /**
     * Public Properties
     */
    public get formUrl(){
        return  `/todos/delete/${this.id}`;
    }

    public get id(){
        return this.model.id;
    }

    public get lastModified(){
        return typeof this.model.dateUpdated !== 'undefined' 
        && this.model.dateUpdated instanceof Date 
        && !isNaN(this.model.dateUpdated.getDate()) ? 
        this.model.dateUpdated : 
        this.model.dateCreated;
    }

    /**
     * Constructor
     * @param router router
     * @param service todo service
     * @param loggerService logger service
     */
    constructor(
        private router:Router,
        private route: ActivatedRoute,
        private session: SessionStorageService, 
        service:ToDoService, 
        loggerService:LoggerService,
        public dialog:MatDialog,
        public snackbar:MatSnackBar){
        this.service = service;
        this.logger = loggerService.getLogger("ToDoDeleteComponent");
    }

    private errorPage(title:string, message:string, link?:string){
        this.errorTitle =title;
        this.message = message;
        if(typeof link === 'string' && link.trim().length > 0){
            this.errorLink =link;
        } else{
            this.errorLink = null;
        }
        this.status = "errorPage";
    }

    /**
     * Route Data Success Response Handler
     * @param resolvedData resolved data
     */
    public routeDataSuccess(resolvedData:{
        message:string, 
        messageType:string, 
        model:ToDoReadModel
     }){
        // get todo read model from route data
        this.model = resolvedData.model;

        // if message in resolved data set with details
        if(resolvedData.message){
            this.message = resolvedData.message;
            let msgType = "";
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

        // subscribe to status updates
        this.statusUpdateSubscription =this.service
            .statusUpdates(this.id)
            .subscribe(
            this.statusUpdate,
            this.statusUpdateError,
            ()=>{ this.statusUpdateSubscription = null; });
        
        // show todo details
        this.status = "active";
    }

    /**
     * Router Data error response handler
     * @param err 
     */
    public routeDataError(err:any){
        if(typeof err == 'object'){
            this.errorPage(err.title, err.message, err.link);
        } else{
            this.router.navigate(["/error"], {skipLocationChange:true});
        }
    }

    /**
     * Delete Todo
     */
    public deleteTodo(){
        // set as deleting
        this.status = "deleting";

        // clear message and validation errors
        this.message = "";
        this.messageClass="text-info";
        this.validationErrors= [];

        // delete todo subscription
        this.submitSubscription = this.service
            .delete(this.id, this.lastModified)
            .subscribe(()=>{
                // store success message to survive redirect
                this.session.set("message", "Successfully created todo!");
                this.session.set("messagetype", "success");

                // redirect to list page
                this.router.navigate(["/todos"]);
            }, err=>{
                switch(err.status){
                    case 400:
                        this.router.navigate(["/error/400"],{skipLocationChange:true});
                        break;
                    case 401:
                        let unauthorisedDialog = this.dialog.open(UnauthorisedDialogComponent);
                       let sub = unauthorisedDialog.afterClosed()
                        .subscribe(result=>{

                        },
                        err=>{},
                        ()=>{this.subscriptions = this.subscriptions.filter(y=>y !== sub);});
                        this.router.navigate(["/error/401"],{skipLocationChange:true}); 
                        break;
                    case 403:
                        this.router.navigate(["/forbidden"],{skipLocationChange:true});
                        break;
                    case 404:
                        this.errorPage("404 - Todo Not Found", err.message);
                        break;
                    case 409:
                    case 412:
                        if(typeof this.getPageDetailsSubscription !== 'undefined'
                        && this.getPageDetailsSubscription instanceof Subscription){
                            this.getPageDetailsSubscription.unsubscribe();
                        }
                        this.message = err.message;
                        this.getPageDetailsSubscription = this.service.getSingle(this.id)
                        .subscribe(updated=>{
                            this.model = updated;
                            this.status = "active";
                        },err=>{
                            this.dialog.open(Error)
                        },()=>{ this.getPageDetailsSubscription = null; });
                        break;
                    case 0:
                    case 408:
                        this.messageClass= "text-warning";
                        this.message = err.message;
                        this.status= "active";
                        break;
                    case 500:
                    case 503:
                    default:
                        this.messageClass= "text-danger";
                        this.message = err.message;
                        this.status= "active";
                        break;

                }
            },()=>{ this.submitSubscription = null; });
    }

    /**
     * Status Update Event Handler
     * @param {Event} $event status update event
     */
    public statusUpdate($event){
        switch($event.type){
            case "Updated":
                // update main details
                this.model.summary =$event.data.summary;
                this.model.name = $event.data.name;
                
                // set last modified details
                this.model.dateUpdated= $event.data.dateUpdated;
                this.model.userUpdatedID = $event.data.username;
                break;
            case "ObjectiveAdded":
                // add objective details
                this.model.objectives.push(ToDoObjectiveReadModel.convert($event.data));
                
                // set last modified details
                this.model.dateUpdated= $event.data.dateUpdated;
                this.model.userUpdatedID = $event.data.username;
                break;
            case "ObjectiveUpdated":
                let objectiveReadModel = this.model.objectives[$event.data.objectiveIndex-1];
                // update relevant objective details
                objectiveReadModel.name = $event.data.name;
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
                    .push(ToDoSubObjectiveReadModel.convert($event.data));

                // set last modified details
                this.model.dateUpdated= $event.data.dateUpdated;
                this.model.userUpdatedID = $event.data.username;
                break;
            case "SubObjectiveUpdated":
                let subObjectiveReadModel = this.model
                .objectives[$event.data.objectiveIndex-1]
                .subObjectives[$event.data.subobjectiveIndex -1];

                // update relevant sub objective
                subObjectiveReadModel.name = $event.data.name;
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
                if(typeof this.getPageDetailsSubscription !== 'undefined'
                && this.getPageDetailsSubscription instanceof Subscription){
                    this.getPageDetailsSubscription.unsubscribe();
                }
                let sbRef= this.snackbar.open("Todo Updated","Update");

               let sub = sbRef.onAction()
                .subscribe(()=>{
                this.getPageDetailsSubscription = this.service
                    .getSingle(this.id)
                    .subscribe(updated=>{
                            this.model = updated; 
                            this.message = "Updated after status update";
                            this.messageClass= "text-info";
                        },
                        this.routeDataError,
                        ()=>{ this.getPageDetailsSubscription = null; });
                    }, err=>{
                        if(typeof err === 'object' && Object.keys(err).some(x=>x == "status")){
                            switch(err.status){
                                case 0: this.status = "offline"; return;
                                case 400: this.errorPage("400 - Bad Request", err.message,this.formUrl); return;
                                case 401: this.router.navigate(["/unauthorised"]); return;
                                case 403: this.errorPage("403 - Forbidden", err.message, "/"); return;
                                case 404: this.errorPage("404 - ToDo Not Found", err.message, "/todos"); return;
                                case 408: this.errorPage("408 - Timeout", err.message, this.formUrl); return;
                                case 410: this.errorPage("410 - ToDo deleted", err.message); return;
                                case 500:this.errorPage("500 - Error", err.message, this.formUrl); return;
                                case 503:this.errorPage("503 - Server Unavailable", err.message, this.formUrl); return;
                                default: 
                                    this.logger.error(err); 
                                    this.errorPage("Error", err.message,this.formUrl); 
                                    return;
                            }
                        } 
                        this.status= "defaultError";
                    },()=>{this.subscriptions = this.subscriptions.filter(x=> x !== sub);});
                break;
            default:
                break;
        }
    }

    /**
     * Status Update Error Event Handler
     * @param err error
     */
    public statusUpdateError(err:any){
        if(typeof err == 'object' && Object.keys(err).some(x=>x =='status')){
           switch(err.status){
                case 404:
                case 410:
                    // set error page
                    this.errorPage(err.title,err.message);
                    return;
           }
        }
    }

    /**
     * Delete Form Submit Handler
     * @param {Event} $event form submit event
     */
    public submit($event:any){
        $event.stopPropogation();
        // delete todo
        this.deleteTodo();
        return false;
    }

    /**
     * Component initialiser
     */
    public ngOnInit(){
        // get todo read model from route data
        this.routeDataSubscription = this.route
        .data
        .subscribe(
        this.routeDataSuccess,
        this.routeDataError,
        ()=>{this.routeDataSubscription = null;});
    }

    /**
     * Component Deconstructor
     */
    public ngOnDestroy(){
        // unsubscribe existing subscriptions
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
    
}