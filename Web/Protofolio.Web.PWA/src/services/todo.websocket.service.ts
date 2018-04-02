import{Observable} from "rxjs/Observable";
import {$WebSocket} from 'angular2-websocket/angular2-websocket';
import {ILogger, LoggerService }from "./todo.logger.service";
import {ToDoReadModel} from "./../models/ToDoReadModel";
import {ToDoSubObjectiveReadModel} from "./../models/ToDoSubObjectiveReadModel";
import {ToDoObjectiveReadModel} from "./../models/ToDoObjectiveReadModel";
import nonce from "nonce";
import { IToDoInputModel } from "../models/ToDoInputModel";

export interface IWSService{
    create(inputModel:any):Observable<ToDoReadModel | number>;
    update(id:number,inputModel:any, lastModified?:Date):Observable<ToDoReadModel | boolean>;
    patch(id:number, inputModel:any, lastModified?:Date):Observable<ToDoReadModel | boolean>;
    delete(id:number, lastModified?:Date): Observable<boolean>;
    getSingle(id:number, lastModified?:Date) :Observable<ToDoReadModel>;
    getPaged(query?:{[key:string]:any}): Observable<{ count:number, items:ToDoReadModel[] }>;

    statusUpdates(id:number): Observable<any>;
    events():Observable<any>;
    eventLog():Observable<any>;
}

/**
 * To Do Websocket service
 */
export class ToDoWebSocketService implements IWSService{
    /**
     * Private Members
     */
    private readonly logger:ILogger;
    private readonly wsUrl:string;

    /**
     * Private Fields
     */
    private websocket: $WebSocket;

    /**
     * Constructor
     * @param config configuration values
     * @param loggerService logger service 
     */
    constructor(config:{wsUrl:string}, loggerService:LoggerService){
        this.logger = loggerService.getLogger("ToDoWebSocketService");
        this.wsUrl = config.wsUrl;
    }

    /**
     * Connect to websocket
     * @param idToken ID Token
     */
    private connectToWebSocket(idToken:any){
       let ws= new $WebSocket(`${this.wsUrl}.ws`);
       //authorise
       ws.send(idToken);
       this.websocket =ws;
    }

    /**
     * RPC Command
     * @param command Command data
     * @param timeoutCount timeout for command
     */
    private rpcCommand(command:{
        type:string,
        data:any
    }, timeoutCount:number = 120000){
        let key=nonce(),
            timestamp = Date.now();

        try{
            this.websocket.send(JSON.stringify({
                type:command.type,
                nonce:key,
                timestamp:timestamp,
                data:command.data
            }));
        }catch(ex){
            return Observable.throw(ex);    
        }

        return this.websocket
        .getDataStream()
        .filter(message=> (message.type =="rpc-response" 
            || message.type == "rpc-error-response")
            && message.nonce == key 
            && message.timestamp== timestamp)
        .timeout(timeoutCount, Observable.throw({
            status:408, 
            message:TimeoutMessage 
        }))
        .flatMap(message=>{
            if(message.type === "rpc-response"){
                return Observable.of(message.data);
            }
            return Observable.throw(message.data); 
        });
    }

    /**
     * Command
     * @param commandID 
     * @param timeoutCount 
     */
    private commandResponse(commandID:string, timeoutCount:number = 120000){
        return this.websocket
        .getDataStream()
        .filter(message=>(message.type === "command-response" 
        || message.type === "command-error-response"
        || message.type === "eventlog") 
        && message.commandID === commandID)
        .flatMap(message=>{
            switch(message.type){
                case "command-response": 
                    return Observable.of(message.data);
                case "command-error-response": 
                    switch(message.data.status){
                        case 400: 
                            return Observable.throw({
                                status:message.data.status,
                                title:"Bad Request",
                                message: message.data.message
                            });
                        case 401:
                            return Observable.throw({
                                status:message.data.status,
                                title:"Unauthorised",
                                message: message.data.message
                            });
                        case 403:
                            return Observable.throw({
                                status:message.data.status,
                                title:"Forbidden",
                                message: message.data.message
                            });
                        case 404:
                            return Observable.throw({
                                status:message.data.status,
                                title:"Todo Not Found",
                                message: message.data.message
                            });
                        case 408:    
                            return Observable.throw({
                                status:message.data.status,
                                title:"Timeout",
                                message: message.data.message
                            });
                        case 410:    
                            return Observable.throw({
                                status:message.data.status,
                                title:"Todo Deleted",
                                message: message.data.message
                            });
                        case 500:
                        default:
                            return Observable.throw({
                                status:message.data.status,
                                title:"Error",
                                message: message.data.message
                            });
                        case 503:    
                            return Observable.throw({
                                status:message.data.status,
                                title:"Server Unavailable",
                                message: message.data.message
                            });

                    }
                case "eventlog": 
                    return Observable.of(message.data);
            }
        })
    }

    /**
     * Create ToDo
     * @param inputModel create input model
     */
    public create(inputModel:IToDoInputModel){
        return this.rpcCommand({
            type:"todo-create",
            data: inputModel
        })
        .flatMap(res=>{
            switch(res.status){
                case 201: return Observable.of(res.data.id);
                case 202: return this.commandResponse(res.data.commandID).map(message=> message.id);
                default: return Observable.throw(res.data);
            }
        });
    }

    /**
     * Update Todo completely
     * @param id todo id
     * @param inputModel todo update input model
     * @param lastModified last modified
     */
    public update(id:number, inputModel:IToDoInputModel, lastModified?:Date){
        return this.rpcCommand({
            type:"todo-update",
            data: Object.assign({ id:id, lastModified:lastModified}, inputModel)
        })
        .flatMap(res=>{
            switch(res.status){
                case 200: return Observable.of(res.data);
                case 204: return Observable.of(true);
                case 202: return this.commandResponse(res.data.commandID).map(message=> (true));
                default: return Observable.throw(res.data);
            }
        });
    }

    /**
     * Patchly update todo
     * @param id todo id
     * @param inputModel partial todo update input model
     * @param lastModified last modified
     */
    public patch(id:number, inputModel:{[key:string] : any}, lastModified?:Date){
        return this.rpcCommand({
            type:"todo-patch",
            data: Object.assign({ id:id, lastModified:lastModified}, inputModel)
        })
        .flatMap(res=>{
            switch(res.status){
                case 200: return Observable.of(res.data);
                case 202: return this.commandResponse(res.data.commandID).map(message=> (true));
                case 204: return Observable.of(true);
                default: return Observable.throw(res.data);
            }
        });
    }

    /**
     * Delete todo
     * @param id todo id
     * @param lastModified last modified 
     */
    public delete(id:number, lastModified?:Date){
        return this.rpcCommand({
            type:"todo-delete",
            data: {id:id, lastModified:lastModified}
        })
        .flatMap(res=>{
            switch(res.status){
                case 200: return Observable.of(res.data);
                case 202: return this.commandResponse(res.data.commandID).map(message=> (true));
                case 204: return Observable.of(true);
                default: return Observable.throw(res.data);
            }
        });
    }

    /**
     * Get single todo
     * @param id todo id
     * @param lastModified last modified
     */
    public getSingle(id:number, lastModified?:Date){
        return this.rpcCommand({
            type:"todo-get-single",
            data: {id:id, lastModified:lastModified}
        }, 30000)
        .flatMap(res=>{
            switch(res.status){
                case 200: return Observable.of(res.data);
                default: return Observable.throw(res.data);
            }
        });
    }

    /**
     * Get paged todo results
     * @param query query parameters
     */
    public getPaged(query?:{[key:string]:any}){
        return this.rpcCommand({
            type:"todo-get-paged",
            data: query
        })
        .flatMap(res=>{
            switch(res.status){
                case 200: return Observable.of(res.data);
                default: return Observable.throw(res.data);
            }
        });
    }

    /**
     * Event Log events
     */
    public eventLog(){
        return this.events()
            .filter(x=>x.type ==="eventlog")
            .map(x=>x.data);
    }

    /**
     * Status Updates
     * @param id todo id
     */
    public statusUpdates(id:number){
        return this.events()
            .filter(x=>x.type ==="eventlog" && x.data.id === id)
            .map(x=>x.data);
    }

    /**
     * Events
     */
    public events(){
        return this.websocket
            .getDataStream();
    }

    /**
     * Deconstructor
     */
    public ngOnDestroy(){
        if(typeof this.websocket !== 'undefined' 
        && this.websocket instanceof WebSocket 
        && (this.websocket.readyState === this.websocket.OPEN
        || this.websocket.readyState === this.websocket.CONNECTING)){
            this.websocket.close();
        }
    }
}