import {Observable} from "rxjs/Observable";
import { ToDoSSEService, ISSEService } from "./todo.sse.service";

import { ToDoWebSocketService, IWSService  } from "./todo.websocket.service";

import { ToDoRestApiService, IRESTApiService } from "./todo.rest-api.service";
import { ToDoReadModel } from "../models/TodoReadModel";
import { IToDoInputModel } from "../models/ToDoInputModel";

export interface IToDoService{
    create(inputModel:IToDoInputModel) :Observable<ToDoReadModel | number>;
    update(id:number, inputModel:IToDoInputModel, lastModified?:Date) : Observable<ToDoReadModel | boolean>;
    delete(id:number, lastModified?:Date) :Observable<ToDoReadModel | boolean>;
    getSingle(id:number, lastModified?:Date):Observable<ToDoReadModel>;
    getPaged(query?:{[key:string]:any}):Observable<{items:ToDoReadModel[], count:number}>;
    statusUpdates(id:number):Observable<any>;
    eventLog():Observable<any>;
}

/**
 * To Do Service
 */
export class ToDoService implements IToDoService {

    /**
     * Private Members
     */
    private readonly restService:IRESTApiService;
    private readonly sseService:ISSEService;
    private readonly wsService:IWSService;

    /**
     * Constructors
     * @param restService REST Api Service
     * @param sseService Server Sent Events Service
     * @param wsService WebSocket Service
     */
    constructor(
        restService:ToDoRestApiService,
        sseService:ToDoSSEService, 
        wsService:ToDoWebSocketService){
        this.restService=restService;
        this.sseService = sseService;
        this.wsService = wsService;
    }

    private get webSocketEnabled(){
        return "WebSocket" in window;
    }

    public create(inputModel:IToDoInputModel){
        if(this.webSocketEnabled){
            return this.wsService.create(inputModel);    
        }
        return this.restService
            .create(inputModel)
            .flatMap((x:ToDoReadModel | string | number)=>{
                if(typeof x=== 'string'){
                    return this.sseService.commandResponse(x);
                } else {
                    return Observable.of(x);
                }
            });
    }

    public update(
        id:number, 
        inputModel:IToDoInputModel, 
        lastModified?:Date){
        if(this.webSocketEnabled){
            return this.wsService.update(id, inputModel, lastModified);
        }
        return  this.restService
            .update(id, inputModel, lastModified)
            .flatMap((x: ToDoReadModel | string | boolean)=>{
                if(typeof x=== 'string'){
                    return this.sseService.commandResponse(x);
                } else {
                    return Observable.of(x);
                }
            });
    }

    public patch(
        id:number,
        inputModel:{[key:string]:any},
        lastModified?:Date){
        if(this.webSocketEnabled){
            return this.wsService.patch(id, inputModel, lastModified);
        }
        return this.restService
            .patch(id, inputModel, lastModified)
            .flatMap((x: ToDoReadModel | string | boolean)=>{
                if(typeof x=== 'string'){
                    return this.sseService.commandResponse(x);
                } else {
                    return Observable.of(x);
                }
            });
    }

    public delete(
        id:number, 
        lastModified?:Date){
        if(this.webSocketEnabled){
            return this.wsService.delete(id, lastModified);
        } 
        return this.restService
            .delete(id,lastModified)
            .flatMap((x: string | boolean)=>{
                if(typeof x=== 'string'){
                    return this.sseService.commandResponse(x);
                } else {
                    return Observable.of(x);
                }
            });
    }

    /**
     * Get To do
     * @param id 
     * @param lastModified 
     */
    public getSingle(
        id:number, 
        lastModified?:Date){
        if(this.webSocketEnabled){
            return this.wsService.getSingle(id, lastModified);
        } 
        return this.restService.getSingle(id, lastModified);
    }

    /**
     * 
     * @param query 
     */
    public getPaged(query?:{[key:string]:any}){
        if(this.webSocketEnabled){
            return this.wsService.getPaged(query);
        }
        return this.restService.getPaged(query);
    }

    /**
     * Status Updates
     * @param id 
     */
    public statusUpdates(id:number){
        if(this.webSocketEnabled){
            return this.wsService.statusUpdates(id);
        }
        return this.sseService.statusUpdates(id);
    }

    /**
     * Event Logs
     */
    public eventLog(){
        if(this.webSocketEnabled){
            return this.wsService.eventLog();
        }
        return this.sseService.eventLog();
    }
}