import {Router} from "@angular/router";
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { AbstractTodoComponent } from "./abstract-todo.component";

import{Subscription} from "rxjs/Subscription";

import {IToDoService, ToDoService} from "./../../services/todo.service";
import{ILogger, LoggerService} from "./../../services/todo.logger.service";
import { ToDoReadModel } from "../../models/TodoReadModel";
import {SessionStorageService} from "angular-web-storage";
/**
 * To do Create form Component
 */
export class ToDoCreateComponent extends AbstractTodoComponent{
    
    /**
     * Private Members
     */

    /**
     * Logger to report errors
     */
    private readonly logger:ILogger;

    /**
     * To Do service used to create todo
     */
    private readonly service:IToDoService;

    /**
     * Private Fields
     */

    /**
     * Route Data Subscription
     */
    private routeDataSubscription:Subscription;

    /**
     * Get Page Details Subscription
     */
    private getPageDetailsSubscription:Subscription;

    /**
     * Submit Subscription
     */
    private submitSubscription:Subscription;
    /**
     * Constructor
     * @param router router
     * @param service todo service
     * @param loggerService logger service
     */
    constructor(
        router:Router, 
        service:ToDoService, 
        private session:SessionStorageService,
        loggerService:LoggerService){
        super(router);
        this.service = service;
        this.logger = loggerService.getLogger("ToDoCreateComponent");
    }

    /**
     * Route Data Success Response handler
     * @param resolvedData resolved data
     */
    public routeDataSuccess(resolvedData:{
        model:ToDoReadModel, 
        message:string, 
        messageType:string
    }){
        this.inputModel.setValue(resolvedData.model);
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
            this.messageClass = msgType;
        } 
        this.status = "active";
    }

    /**
     * Route data error response
     * @param err error 
     */
    public routeDataError(err:any){
        if(typeof err == 'object'){
            this.errorPage(err.title, err.message, err.link);
        } else{
            this.router.navigate(["/error"], {skipLocationChange:true});
        }
    }

    /**
     * Create To Do
     */
    public createToDo(){
        // set as submitting
        this.status = "submitting";

        // clear message and validation errors
        this.message = "";
        this.messageClass="text-info";
        this.validationErrors= [];

        // clear existing subscriptions
        if(typeof this.submitSubscription !== 'undefined' 
        && this.submitSubscription != null){
            this.submitSubscription.unsubscribe();
        }
        if(typeof this.getPageDetailsSubscription !=='undefined'
        && this.getPageDetailsSubscription != null){
            this.getPageDetailsSubscription.unsubscribe();
        }

        // setup submit subscription
        this.submitSubscription = this.service
            .create(this.inputModel.value)
            .subscribe((result:ToDoReadModel | number)=>{
                // store message in session storage to survive redirect
                this.session.set("message", "Successfully created todo!");
                this.session.set("messagetype", "success");
                if(result instanceof ToDoReadModel){
                    // store read model in session storage to survive redirect
                    this.session.set("todo", result);
                    this.router.navigate(["/todos", result.id]);
                } else{
                    this.router.navigate(["/todos", result]);
                }
            }, err=>{
                switch(err.status){
                    case 400:
                        this.router.navigate(["/error/400"],{skipLocationChange:true});
                        break;
                    case 401:
                        this.router.navigate(["/unauthorised"],{skipLocationChange:true}); 
                        break;
                    case 403:
                        this.router.navigate(["/forbidden"],{skipLocationChange:true});
                        break;
                    case 404:
                        this.errorPage("404 - Todo Not Found", err.message);
                        break;
                    case 422:
                        this.messageClass= "text-warning";
                        this.message = err.message;
                        this.validationErrors = err.validationErrors;
                        this.status= "active";
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
            },()=>{
                this.submitSubscription = null;
            });

    }

    /**
     * Submit Form Event Handler
     * @param {Event} $event
     */
    public submit($event:any){
        $event.stopPropogation();
        this.createToDo();
        return false;
    }

    /**
     * Refresh Link click handler
     * @param {Event} $event
     */
    public refresh($event:any){
        $event.stopPropogation();
        this.router.navigate(["/"], {skipLocationChange:true});
        this.router.navigate(["/todos/create"],{skipLocationChange:true});
        return false;
    }
}