import {Observable} from "rxjs/Observable";
import { ILogger, LoggerService} from "./todo.logger.service";

export interface ISSEService {
    statusUpdates(id:number): Observable<any>;
    allStatusUpdates(query?:{[key:string]:any}):Observable<any>;
    commandResponse(commandID:string):Observable<any>;
    commandsResponse(query?:{[key:string]:any}):Observable<any>;
    eventLog(query?:{[key:string]:any}):Observable<any>;
}

/**
 * To Do Server Sent Events Service
 */
export class ToDoSSEService implements ISSEService {
    /**
     * Private Members
     */
    private readonly logger:ILogger;
    private readonly sseUrl:string;

    /**
     * Constructor
     * @param config configuration values 
     * @param loggerService logger service
     */
    constructor(config:{sseUrl:string}, loggerService:LoggerService){
        this.logger=loggerService.getLogger("ToDoSSEService");
        this.sseUrl = config.sseUrl;
    }

    /**
     * Server Sent Events Observable
     * @param url url
     */
    private sseObservable(url:string){
        return Observable.create(observer=>{
            let es = new EventSource(url);
            es.onopen =  ev=> observer.next(ev);
            es.onmessage =ev=>observer.next(ev);
            es.onerror = ev=> observer.error(ev);
            return ()=>es.close();
        });
    }

    /**
     * Command response
     * @param query query params
     */
    public commandsResponse(query?:{[key:string]:any}){
        let url =`${this.sseUrl}/sse/commands`;
        let queryParams= new QueryParams();
        return this.sseObservable(url);
    }

    /**
     * Get Command response with id
     * @param commandID Command ID
     */
    public commandResponse(commandID:string){
        return this.sseObservable(`${this.sseUrl}/sse/commands/${commandID}`);
    }

    /**
     * Get Status Updates
     * @param id todo id
     */
    public statusUpdates(id:number){
        return this.sseObservable(`${this.sseUrl}/sse/todos/${id}`);
    }

    /**
     * Get status updates 
     * @param query query params
     */
    public allStatusUpdates(query?:{[key:string]:any}){
        let url= `${this.sseUrl}/sse/todos`;

        return this.sseObservable(url);
    }

    /**
     * Get Event Log
     * @param query query params
     */
    public eventLog(query?:{[key:string]:any}){
        let url =`${this.sseUrl}/sse/eventlog`;
        return this.sseObservable(url);
    }
}