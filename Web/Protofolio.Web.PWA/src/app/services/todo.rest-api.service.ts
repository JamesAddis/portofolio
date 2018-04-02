import {Observable} from "rxjs/Observable";
import { ToDoReadModel } from "../models/TodoReadModel";
import { IToDoInputModel, IToDoObjectiveInputModel, IToDoSubObjectiveInputModel } from "../models/ToDoInputModel";
import { ToDoSubObjectiveReadModel } from "../models/ToDoSubObjectiveReadModel";
import { ToDoObjectiveReadModel } from "../models/ToDoObjectiveReadModel";

export interface IRESTApiService{
    create(inputModel:IToDoInputModel):Observable<ToDoReadModel | number | string>;
    update(id:number,inputModel:IToDoInputModel, lastModified?:Date):Observable<ToDoReadModel | boolean | string>;
    patch(id:number, inputModel:{[key:string]:any}, lastModified?:Date):Observable<ToDoReadModel | boolean | string>;
    delete(id:number, lastModified?:Date): Observable<boolean | string>;
    getSingle(id:number, lastModified?:Date) :Observable<ToDoReadModel>;
    getPaged(query?:{[key:string]:any}): Observable<{ count:number, items:ToDoReadModel[] }>;
}

/**
 * Todo REST Api Service
 */
export class ToDoRestApiService{

    /**
     * Private Members
     */
    private readonly logger:ILogger;
    private readonly apiUrl:string;
    private readonly ie:boolean = false;

    /**
     * Constructor
     * @param config 
     * @param loggerService 
     */
    constructor(config:{apiUrl:string}, loggerService:LoggerService){
        this.logger = loggerService.getLogger("ToDoRestApiService");
        this.apiUrl = config.apiUrl;
    }

    private createSuccessResponse(res){
        if(res.status === 201 && typeof res.body === 'object'){
            return Observable.of(ToDoReadModel.convert(res.body));
         } else if(res.status === 202 && res.body === 'object'){
             return  Observable.of(res.body.commandID);
         } else if(res.headers.get("X-Created").trim().length > 0){
             return Observable.of(parseInt(res.headers.get("X-Created"),10));
         } else if(res.headers.get("X-Accepted").trim().length > 0){
             return Observable.of(res.headers.get("X-Accepted"));
         }
         return Observable.throw({status:res.status, error:res.body, headers:res.headers});
    }

    /**
     * Create Error Response
     * @param err 
     */
    private createErrorResponse(err){
        if(err.status === 0){
            return Observable.throw({
                status:0,
                message: err.statusText == "aborted" ? SubmitAborted : SubmitOffline 
            });
        }
        if(err.headers.get("X-Created").trim().length > 0){
            return Observable.of(parseInt(err.headers.get("X-Created"),10));
        }
        if(err.headers.get("X-Accepted").trim().length > 0){
            return Observable.of(err.headers.get("X-Accepted"));
        }

        let errorData:any ={};
        if(errorData.status !== 0){
            
            try{
                errorData = err.error;
            }catch(ex){
                this.logger.error(ex);
            }
        }
        switch(err.status){
            
            case 422:
                return Observable.throw({
                    status:422,
                    message: typeof errorData == 'object' 
                    && Object.keys(errorData).some(x=>x == 'message') 
                    && typeof errorData.message === 'string' 
                    && errorData.message.trim().length > 0 ? 
                    errorData.message : SubmitUnprocessable,
                    validationErrors: typeof errorData == 'object' 
                    && Object.keys(errorData).some(x=>x == 'validationErrors') 
                    && typeof errorData.validationErrors !== 'undefined'
                    && errorData.validationErrors instanceof Array ? 
                    errorData : []
                });
            default:
                return Observable.throw({
                    status:err.status,
                    message: typeof errorData == 'object' 
                    && Object.keys(errorData).some(x=>x == 'message') 
                    && typeof errorData.message === 'string' 
                    && errorData.message.trim().length > 0 ? 
                    errorData.message : SubmitError
                });
        }
    }

    /**
     * Update Success response
     * @param res 
     */
    private updateSuccessResponse(res){
        if(res.status === 200){
            return Observable.of(ToDoReadModel.convert(res.body));
        } else if(res.status === 202){
            return Observable.of(res.body.commandID);
        } else if(res.status === 204){
            return Observable.of(true);
        } else if(res.headers.get("X-Updated").trim().length > 0){
            return Observable.of(true);
        } else if(res.headers.get("X-Accepted").trim().length > 0){
            return Observable.of(res.headers.get("X-Accepted"));
        } else {
            return Observable.throw({status:res.status, error:res.body, headers:res.headers});
        }
    }

    private updateErrorResponse(err){
        if(err.status === 0){
            return Observable.throw({
                status:0,
                message: err.statusText == "aborted" ? "Cancelled" : UpdateOffline
            });
        }
        if(err.headers.get("X-Updated").trim().length > 0){
            return Observable.of(true);
        } else if(err.headers.get("X-Accepted").trim().length > 0){
            return Observable.of(err.headers.get("X-Accepted"));
        } 
        switch(err.status){
            case 401:
                return Observable.throw({
                    status:401,
                    title:"Unauthorised",
                    message: err.error.message
                });
            case 403:
                return Observable.throw({
                    status:403,
                    title:"Forbidden",
                    message: err.error.message
                });
            case 404:
                return Observable.throw({
                    status:404,
                    title:"Todo Not Found",
                    message: err.error.message
                });
            case 408:
                return Observable.throw({
                    status:err.status,
                    title:"Timeout",
                    message: err.error.message
                });
            case 410:    
                return Observable.throw({
                    status:410,
                    title:"Todo Deleted",
                    message: err.error.message
                });
            case 409:
            case 412:
                return Observable.throw({
                    status: err.status,
                    message: err.error.message,
                    validationErrors: err.error.validationErrors
                });
            case 422:
                return Observable.throw({
                    status: err.status,
                    message: err.error.message,
                    validationErrors: err.error.validationErrors
                });
            default: 
                return Observable.throw({
                    status:err.status,
                    title:"Error",
                    message: err.error.message
                });
        }
    }

    private deleteSuccessResponse(res){
         if(res.status === 204){
             return Observable.of(true);
         } else if(res.status === 202){
             return Observable.of(res.body.commandID);
         }
         return Observable.throw({status:res.status, error:res.body, headers:res.headers});
    }

    private deleteErrorResponse(err){
        if(err.status === 0){
            return  Observable.throw({
                status:err.status,
                message: err.statusText === 'aborted'?"Cancelled" : OfflineDelete
            });
        }
        if(err.headers.get("X-Deleted")){
            return Observable.of(true);
        }
        if(err.headers.get("X-Accepted")){
            return Observable.of(err.headers.get("X-Accepted"));
        }

        switch(err.status){
            case 400: return Observable.throw({status:err.status,message: err.error.message, title:"Bad Request"});
            case 401: return Observable.throw({status:err.status,message: err.error.message, title:"Unauthorised"});
            case 403: return Observable.throw({status:err.status,message: err.error.message, title:"Forbidden"});
            case 404: return Observable.throw({status:err.status,message: err.error.message, title:"To do Not Found"});
            case 408: return Observable.throw({status:err.status,message: err.error.message, title:"Timeout"});
            case 409:
            case 412: 
                return Observable.throw({status:err.status,message: err.error.message, validationErrors:err.error.validationErrors, title:"Conflict"});
            case 410: return Observable.throw({status:err.status,message: err.error.message, title:"To do Deleted"});
            case 500:
            default: return Observable.throw({status:err.status,message: err.error.message, title:"Error"});
            case 503: return Observable.throw({status:err.status,message: err.error.message, title:"Server Unavailable"});
        }
    }

    private createObjectiveSuccessResponse(res){
        if(res.status === 201){
            return Observable.of(ToDoObjectiveReadModel.convert(res.body));
        } else if(res.status === 202){
            return Observable.of(res.body.commandID);
        } else if(res.headers.get("X-Objective-Created")){
            return Observable.of(parseInt(res.headers.get("X-Objective-Created"),10));
        } else if(res.headers.get("X-Accepted")){
            return Observable.of(res.headers.get("X-Accepted"));
        } else{
            return Observable.throw({status:res.status, error:res.body, headers: res.headers});
        }
    }

    private createObjectiveErrorResponse(err){
        if(err.status === 0){
            return  Observable.throw({
                status:err.status,
                message: err.statusText === 'aborted'?"Cancelled" : OfflineDelete
            });
        }
        if(err.headers.get("X-Deleted")){
            return Observable.of(true);
        }
        if(err.headers.get("X-Accepted")){
            return Observable.of(err.headers.get("X-Accepted"));
        }

        switch(err.status){
            case 400: return Observable.throw({status:err.status,message: err.error.message, title:"Bad Request"});
            case 401: return Observable.throw({status:err.status,message: err.error.message, title:"Unauthorised"});
            case 403: return Observable.throw({status:err.status,message: err.error.message, title:"Forbidden"});
            case 404:
                return Observable.throw({
                    status:err.status,
                    message: err.error.message,
                    title:"To do Not Found"
                });
            case 406:return Observable.throw({status:err.status, message:err.error.message, validationErrors:err.error.validationErrors});
            case 408: return Observable.throw({status:err.status,message: err.error.message, title:"Timeout"});
            case 409:
            case 412: 
                return Observable.throw({status:err.status,message: err.error.message, validationErrors:err.error.validationErrors, title:"Conflict"});
            case 410: return Observable.throw({status:err.status,message: err.error.message, title:"To do Deleted"});
            case 422: return Observable.throw({status:err.status, message:err.error.message, validationErrors:err.error.validationErrors});
            case 500:
            default: return Observable.throw({status:err.status,message: err.error.message, title:"Error"});
            case 503: return Observable.throw({status:err.status,message: err.error.message, title:"Server Unavailable"});
        }
    }

    private updateObjectiveSuccessResponse(res){
        if(res.status === 200){
            return Observable.of(ToDoObjectiveReadModel.convert(res.body));
        } else if(res.status === 204){
            return Observable.of(true);
        } else if(res.status === 202){
            return Observable.of(res.body.commandID);
        } else if(res.headers.get("X-Objective-Updated")){
            return Observable.of(true);
        } else if(res.headers.get("X-Accepted")){
            return Observable.of(res.headers.get("X-Accepted"));
        } else{
            return Observable.throw({status:res.status, error:res.body, headers:res.headers});
        }
    }
    
    private updateObjectiveErrorResponse(err){
        if(err.status === 0){
            return  Observable.throw({
                status:err.status,
                message: err.statusText === 'aborted'?"Cancelled" : OfflineDelete
            });
        }
        if(err.headers.get("X-Deleted")){
            return Observable.of(true);
        }
        if(err.headers.get("X-Accepted")){
            return Observable.of(err.headers.get("X-Accepted"));
        }

        switch(err.status){
            case 400: return Observable.throw({status:err.status,message: err.error.message, title:"Bad Request"});
            case 401: return Observable.throw({status:err.status,message: err.error.message, title:"Unauthorised"});
            case 403: return Observable.throw({status:err.status,message: err.error.message, title:"Forbidden"});
            case 404:
                return Observable.throw({
                    status:err.status,
                    message: err.error.message,
                    type: err.headers.get("X-Objective-Not-Found") ? "objective" : "todo",
                    title:"To do Not Found"
                });
            case 408: return Observable.throw({status:err.status,message: err.error.message, title:"Timeout"});
            case 409:
            case 412: 
                return Observable.throw({status:err.status,message: err.error.message, validationErrors:err.error.validationErrors, title:"Conflict"});
            case 410: return Observable.throw({status:err.status,message: err.error.message, title:"To do Deleted"});
            case 500:
            default: return Observable.throw({status:err.status,message: err.error.message, title:"Error"});
            case 503: return Observable.throw({status:err.status,message: err.error.message, title:"Server Unavailable"});
        }
    }
    
    private deleteObjectiveSuccessResponse(res){
        if(res.status === 204){
            return Observable.of(true);
        } else if(res.status === 202){
            return Observable.of(res.body.commandID);
        } else if(res.headers.get("X-Objective-Deleted")){
            return Observable.of(true);
        } else if(res.headers.get("X-Accepted")){
            return Observable.of(res.headers.get("X-Accepted"));
        } else{
            return Observable.throw({status:res.status, error:res.body, headers:res.headers});
        }
    }
    
    private deleteObjectiveErrorResponse(err){
        if(err.status === 0){
            return  Observable.throw({
                status:err.status,
                message: err.statusText === 'aborted'?"Cancelled" : OfflineDelete
            });
        }
        if(err.headers.get("X-Deleted")){
            return Observable.of(true);
        }
        if(err.headers.get("X-Accepted")){
            return Observable.of(err.headers.get("X-Accepted"));
        }

        switch(err.status){
            case 400: return Observable.throw({status:err.status,message: err.error.message, title:"Bad Request"});
            case 401: return Observable.throw({status:err.status,message: err.error.message, title:"Unauthorised"});
            case 403: return Observable.throw({status:err.status,message: err.error.message, title:"Forbidden"});
            case 404:
                return Observable.throw({
                    status:err.status,
                    message: err.error.message,
                    type: err.headers.get("X-Objective-Not-Found") ? "objective":"todo",
                    title:"To do Not Found"
                });
            case 408: return Observable.throw({status:err.status,message: err.error.message, title:"Timeout"});
            case 409:
            case 412: 
                return Observable.throw({status:err.status,message: err.error.message, validationErrors:err.error.validationErrors, title:"Conflict"});
            case 410: return Observable.throw({status:err.status,message: err.error.message, title:"To do Deleted"});
            case 422: return Observable.throw({status:err.status, message:err.error.message, validationErrors:err.error.validationErrors});
            case 500:
            default: return Observable.throw({status:err.status,message: err.error.message, title:"Error"});
            case 503: return Observable.throw({status:err.status,message: err.error.message, title:"Server Unavailable"});
        }
    }

    private createSubObjectiveSuccessResponse(res){
        if(res.status ===201){
            return Observable.of(ToDoSubObjectiveReadModel.convert(res.body));
        } else if(res.status === 202){
            return Observable.of(res.body.commandID);
        } else if(res.headers.get("X-Sub-Objective-Created")){
            return Observable.of(parseInt(res.headers.get("X-Sub-Objective-Created"),10));
        } else if(res.headers.get("X-Accepted")){
            return Observable.of(res.headers.get("X-Accepted"));
        } else{
            return Observable.throw({
                status: res.status,
                error:res.body,
                headers:Headers
            });
        }
    }

    private createSubObjectiveErrorResponse(err){
        if(err.status === 0){
            return  Observable.throw({
                status:err.status,
                message: err.statusText === 'aborted'?"Cancelled" : OfflineDelete
            });
        }
        if(err.headers.get("X-Deleted")){
            return Observable.of(true);
        }
        if(err.headers.get("X-Accepted")){
            return Observable.of(err.headers.get("X-Accepted"));
        }

        switch(err.status){
            case 400: return Observable.throw({status:err.status,message: err.error.message, title:"Bad Request"});
            case 401: return Observable.throw({status:err.status,message: err.error.message, title:"Unauthorised"});
            case 403: return Observable.throw({status:err.status,message: err.error.message, title:"Forbidden"});
            case 404:
                return Observable.throw({
                    status:err.status,
                    message: err.error.message,
                    type: err.headers.get("X-Sub-Objective-Not-Found") ? "subobjective" : err.headers.get("X-Objective-Not-Found") ? "objective" :"todo",
                    title:"To do Not Found"
                });
            case 406:return Observable.throw({status:err.status, message:err.error.message, validationErrors:err.error.validationErrors});
            case 408: return Observable.throw({status:err.status,message: err.error.message, title:"Timeout"});
            case 409:
            case 412: 
                return Observable.throw({status:err.status,message: err.error.message, validationErrors:err.error.validationErrors, title:"Conflict"});
            case 410: return Observable.throw({status:err.status,message: err.error.message, title:"To do Deleted"});
            case 422: return Observable.throw({status:err.status, message:err.error.message, validationErrors:err.error.validationErrors});
            case 500:
            default: return Observable.throw({status:err.status,message: err.error.message, title:"Error"});
            case 503: return Observable.throw({status:err.status,message: err.error.message, title:"Server Unavailable"});
        }
    }

    private updateSubObjectiveSuccessResponse(res){
        if(res.status === 200){
            return Observable.of(ToDoSubObjectiveReadModel.convert(res.body));
        } else if(res.status === 202){
            return Observable.of(res.headers.get("X-Accepted"));
        } else if(res.headers.get("X-Sub-Objective-Updated")){
            return Observable.of(parseInt(res.headers.get("X-Sub-Objective-Updated"),10));
        } else if(res.header.get("X-Accepted")){
            return  Observable.of(res.headers.get("X-Accepted"));
        }
    }
    
    private updateSubObjectiveErrorResponse(err){
        if(err.status === 0){
            return  Observable.throw({
                status:err.status,
                message: err.statusText === 'aborted'?"Cancelled" : OfflineDelete
            });
        }
        if(err.headers.get("X-Deleted")){
            return Observable.of(true);
        }
        if(err.headers.get("X-Accepted")){
            return Observable.of(err.headers.get("X-Accepted"));
        }

        switch(err.status){
            case 400: return Observable.throw({status:err.status,message: err.error.message, title:"Bad Request"});
            case 401: return Observable.throw({status:err.status,message: err.error.message, title:"Unauthorised"});
            case 403: return Observable.throw({status:err.status,message: err.error.message, title:"Forbidden"});
            case 404:
                return Observable.throw({
                    status:err.status,
                    message: err.error.message,
                    type: err.headers.get("X-Sub-Objective-Not-Found") ? "subobjective" : err.headers.get("X-Objective-Not-Found") ? "objective" :"todo",
                    title:"To do Not Found"
                });
            case 408: return Observable.throw({status:err.status,message: err.error.message, title:"Timeout"});
            case 409:
            case 412: 
                return Observable.throw({status:err.status,message: err.error.message, validationErrors:err.error.validationErrors, title:"Conflict"});
            case 410: return Observable.throw({status:err.status,message: err.error.message, title:"To do Deleted"});
            case 422: return Observable.throw({status:err.status, message:err.error.message, validationErrors:err.error.validationErrors});
            case 500:
            default: return Observable.throw({status:err.status,message: err.error.message, title:"Error"});
            case 503: return Observable.throw({status:err.status,message: err.error.message, title:"Server Unavailable"});
        }
    }
    
    private deleteSubObjectiveSuccessResponse(res){
        if(res.status === 204){
            return Observable.of(true);
        } else if(res.status ===202){
            return Observable.of(res.body.commandID);
        } else if(res.headers.get("X-Deleted")) {
            return Observable.of(true);
        } else if(res.headers.get("X-Accepted")){
            return Observable.of(res.headers.headers.get("X-Accepted"));
        } else {
            return Observable.throw({
                status:res.status,
                error:res.body,
                headers:res.headers
            });
        }
    }
    
    private deleteSubObjectiveErrorResponse(err){
        if(err.status === 0){
            return  Observable.throw({
                status:err.status,
                message: err.statusText === 'aborted'?"Cancelled" : OfflineDelete
            });
        }
        if(err.headers.get("X-Sub-Objective-Deleted")){
            return Observable.of(true);
        }
        if(err.headers.get("X-Accepted")){
            return Observable.of(err.headers.get("X-Accepted"));
        }

        switch(err.status){
            case 400: return Observable.throw({status:err.status,message: err.error.message, title:"Bad Request"});
            case 401: return Observable.throw({status:err.status,message: err.error.message, title:"Unauthorised"});
            case 403: return Observable.throw({status:err.status,message: err.error.message, title:"Forbidden"});
            case 404:
                return Observable.throw({
                    status:err.status,
                    message: err.error.message,
                    type: err.headers.get("X-Objective-Not-Found") ? 
                        "objective" : 
                        err.headers.get("X-Sub-Objective-Not-Found") ? 
                        "subobjective" :
                        "todo",
                    title:"To do Not Found"
                });
            case 408: return Observable.throw({status:err.status,message: err.error.message, title:"Timeout"});
            case 409:
            case 412: 
                return Observable.throw({status:err.status,message: err.error.message, validationErrors:err.error.validationErrors, title:"Conflict"});
            case 410: return Observable.throw({status:err.status,message: err.error.message, title:"To do Deleted"});
            case 422: return Observable.throw({status:err.status, message:err.error.message, validationErrors:err.error.validationErrors});
            case 500:
            default: return Observable.throw({status:err.status,message: err.error.message, title:"Error"});
            case 503: return Observable.throw({status:err.status,message: err.error.message, title:"Server Unavailable"});
        }
    }

    private getSingleSuccessResponse(res){
        if(res.status === 200){
            return Observable.of(ToDoReadModel.convert(res.body));
        }
        return Observable.throw({status:res.status,error:res.body, headers:res.headers});
    }

    private getSingleErrorResponse(err){
        if(err.status === 0){
            return Observable.throw({
                status:err.status, 
                message: err.statusText == "aborted"? "Cancelled": messages.todos.GetSingleOffline,
                title:"Offline"
            });
        }
        switch(err.status){
            case 400:return Observable.throw({status:err.status, message:err.error.message, title:"Bad Request"});
            case 401:return Observable.throw({status:err.status, message:err.error.message, title:"Unauthorised"});
            case 403:return Observable.throw({status:err.status, message:err.error.message, title:"Forbidden"});
            case 404:return Observable.throw({status:err.status, message:err.error.message, title:"To Do Not Found"});
            case 408:return Observable.throw({status:err.status, message:err.error.message, title:"Timeout"});
            case 410:return Observable.throw({status:err.status, message:err.error.message, title:"To Do Deleted"});
            case 500:
            default: return Observable.throw({status:err.status, message:err.error.message, title:"Error"});
            case 503:return Observable.throw({status:err.status, message:err.error.message, title:"Server Unavailable"});
        }
    }

    private getPagedErrorResponse(err){
        if(err.status === 0){
            return Observable.throw({
                status:err.status, 
                message: err.statusText == "aborted"? "Cancelled": messages.todos.GetSingleOffline,
                title:"Offline"
            });
        }
        switch(err.status){
            case 400:return Observable.throw({status:err.status, message:err.error.message, title:"Bad Request"});
            case 401:return Observable.throw({status:err.status, message:err.error.message, title:"Unauthorised"});
            case 403:return Observable.throw({status:err.status, message:err.error.message, title:"Forbidden"});
            case 408:return Observable.throw({status:err.status, message:err.error.message, title:"Timeout"});
            case 500:
            default: return Observable.throw({status:err.status, message:err.error.message, title:"Error"});
            case 503:return Observable.throw({status:err.status, message:err.error.message, title:"Server Unavailable"});
        }   
    }

    /**
     * Create To do
     * @param inputModel 
     */
    public create(inputModel:IToDoInputModel){
       return this.http
            .post(`${this.apiUrl}/api/todos`, inputModel)
            .timeout(120000, TimeoutResponse(SubmitTimeout))
            .flatMap(res=> this.createSuccessResponse(res))
            .catch(err=> this.createErrorResponse(err));
    }
     
    /**
     * Partial Update Todo
     * @param id 
     * @param inputModel 
     * @param lastModified 
     */
    public patch(
        id:number,
        inputModel:{ [key:string]:any }, 
        lastModified?: Date){

        return this.http
        .patch(`${this.apiUrl}/api/todos/${id}`, inputModel)
        .flatMap(res=> this.updateSuccessResponse(res))
        .catch(err=> this.updateErrorResponse(err));
    }

    /**
     * Update Todo
     * @param id 
     * @param inputModel 
     * @param lastModified 
     */
    public update(
        id:number, 
        inputModel:IToDoInputModel, 
        lastModified?:Date){
        return this.http
        .patch(`${this.apiUrl}/api/todos/${id}`, inputModel)
        .flatMap(res=> this.updateSuccessResponse(res))
        .catch(err=> this.updateErrorResponse(err));        
    }

    /**
     * Delete Todo
     * @param id 
     * @param lastModified 
     */
    public delete(
        id:number, 
        lastModified?:Date){
        return this.http
        .delete(`${this.apiUrl}/api/todos/${id}`)
        .flatMap(res=>{
            if(res.status === 202){
                return Observable.of(res.body);
            }
            return Observable.of(null);
        })
        .catch(err=>{
            switch(err.status){
                case 0:
                    return Observable.throw({
                        status:0,
                        message: err.statusText == "aborted" ? "Cancelled" : DeleteOffline
                    });
                case 401:
                    return Observable.throw({
                        status:401,
                        title:"Unauthorised",
                        message: err.error.message
                    });
                case 403:
                    return Observable.throw({
                        status:403,
                        title:"Forbidden",
                        message: err.error.message
                    });
                case 404:
                    return Observable.throw({
                        status:404,
                        title:"Todo Not Found",
                        message: err.error.message
                    });
                case 408:
                    return Observable.throw({
                        status:err.status,
                        title:"Timeout",
                        message: err.error.message
                    });
                case 410:    
                    return Observable.throw({
                        status:410,
                        title:"Todo Deleted",
                        message: err.error.message
                    });
                case 409:
                case 412:
                    return Observable.throw({
                        status: err.status,
                        message: err.error.message,
                        validationErrors: err.error.validationErrors
                    });
                default: 
                    return Observable.throw({
                        status:err.status,
                        title:"Error",
                        message: err.error.message
                    });
            }
        });
    }

    /**
     * Create Objective
     * @param id 
     * @param index 
     * @param inputModel 
     * @param lastModified 
     */
    public createObjective(
        id:number, 
        index:number, 
        inputModel:IToDoObjectiveInputModel, 
        lastModified?:Date){
            return this.http
            .post(`${this.apiUrl}/api/todos/${id}/objectives`, inputModel)
            .timeout(120000, TimeoutResponse(SubmitTimeout))
            .flatMap(res=> this.createObjectiveSuccessResponse(res))
            .catch(err=> this.createObjectiveErrorResponse(err));
    }

    /**
     * Update Objective
     * @param id 
     * @param index 
     * @param inputModel 
     * @param lastModified 
     */
    public updateObjective(
        id:number, 
        index:number, 
        inputModel:IToDoObjectiveInputModel, 
        lastModified?:Date){
            return this.http
            .put(`${this.apiUrl}/api/todos/${id}/objectives/${index}`, inputModel)
            .timeout(120000, TimeoutResponse(SubmitTimeout))
            .flatMap(res=> this.updateObjectiveSuccessResponse(res))
            .catch(err=> this.updateObjectiveErrorResponse(err));

    }

    /**
     * Patch Objective
     * @param id 
     * @param index 
     * @param inputModel 
     * @param lastModified 
     */
    public patchObjective(
        id:number, 
        index:number, 
        inputModel:{[key:string]:any}, 
        lastModified?:Date){
            return this.http
            .patch(`${this.apiUrl}/api/todos/${id}/objectives/${index}`, inputModel)
            .timeout(120000, TimeoutResponse(SubmitTimeout))
            .flatMap(res=> this.updateObjectiveSuccessResponse(res))
            .catch(err=> this.updateObjectiveErrorResponse(err));
    }

    /**
     * Delete Objective
     * @param id 
     * @param index 
     * @param lastModified 
     */
    public deleteObjective(
        id:number, 
        index:number, 
        lastModified?:Date){
            return this.http
            .delete(`${this.apiUrl}/api/todos/${id}/objectives/${index}`)
            .timeout(120000, TimeoutResponse(SubmitTimeout))
            .flatMap(res=> this.deleteObjectiveSuccessResponse(res))
            .catch(err=> this.deleteObjectiveErrorResponse(err));
    }

    /**
     * Create Sub Objective
     * @param id 
     * @param index 
     * @param subIndex 
     * @param inputModel 
     * @param lastModified 
     */
    public createSubObjective(
        id:number, 
        index:number, 
        subIndex:number, 
        inputModel:IToDoSubObjectiveInputModel, 
        lastModified?:Date){
            return this.http
            .post(`${this.apiUrl}/api/todos/${id}/objectives/${index}/subobjectives`, inputModel)
            .timeout(120000, TimeoutResponse(SubmitTimeout))
            .flatMap(res=> this.createSubObjectiveSuccessResponse(res))
            .catch(err=> this.createSubObjectiveErrorResponse(err));
    }

    /**
     * Update Sub Objective
     * @param id 
     * @param index 
     * @param subIndex 
     * @param inputModel 
     * @param lastModified 
     */
    public updateSubObjective(
        id:number, 
        index:number, 
        subIndex:number, 
        inputModel:IToDoSubObjectiveInputModel, 
        lastModified?:Date){
            return this.http
            .put(`${this.apiUrl}/api/todos/${id}/objectives/${index}/subobjectives/${subIndex}`, inputModel)
            .timeout(120000, TimeoutResponse(SubmitTimeout))
            .flatMap(res=> this.updateSubObjectiveSuccessResponse(res))
            .catch(err=> this.updateSubObjectiveErrorResponse(err));

    }
    
    /**
     * Patch Sub Objective
     * @param id 
     * @param index 
     * @param subIndex 
     * @param inputModel 
     * @param lastModified 
     */
    public patchSubObjective(
        id:number, 
        index:number, 
        subIndex:number, 
        inputModel:{[key:string]:any}, 
        lastModified?:Date){
            return this.http
            .patch(`${this.apiUrl}/api/todos/${id}/objectives/${index}/subobjectives/${subIndex}`, inputModel)
            .timeout(120000, TimeoutResponse(SubmitTimeout))
            .flatMap(res=> this.updateSubObjectiveSuccessResponse(res))
            .catch(err=> this.updateSubObjectiveErrorResponse(err));
    }
    
    /**
     * Delete Sub Objective
     * @param id 
     * @param index 
     * @param subIndex 
     * @param lastModified 
     */
    public deleteSubObjective(
        id:number, 
        index:number, 
        subIndex:number, 
        lastModified?:Date){
        return this.http
        .patch(`${this.apiUrl}/api/todos/${id}/objectives/${index}/subobjectives/${subIndex}`)
        .timeout(120000, TimeoutResponse(SubmitTimeout))
        .flatMap(res=> this.deleteSubObjectiveSuccessResponse(res))
        .catch(err=> this.deleteSubObjectiveErrorResponse(err));
    }

    /**
     * Get Single
     * @param id 
     */
    public getSingle(id:number, lastModified?:Date){
        return this.http
            .get(`${this.apiUrl}/api/todos/${id}`)
            .flatMap(res=>{
                if(res.status===200 
                    && typeof res.body !== 'undefined' 
                    && res.body instanceof Array){
                    return Observable.of(res.body);
                }
                return Observable.throw(res);
            })
            .catch(err=>{
                switch(err.status){
                    case 0:
                        return Observable.throw({
                            status:0,
                            message: err.statusText == "aborted" ? "Cancelled" : GetSingleOffline
                        });
                    case 401:
                        return Observable.throw({
                            status:401,
                            title:"Unauthorised",
                            message: err.error.message
                        });
                    case 403:
                        return Observable.throw({
                            status:403,
                            title:"Forbidden",
                            message: err.error.message
                        });
                    case 404:
                        return Observable.throw({
                            status:404,
                            title:"Todo Not Found",
                            message: err.error.message
                        });
                    case 408:
                        return Observable.throw({
                            status:err.status,
                            title:"Timeout",
                            message: err.error.message
                        });
                    case 410:    
                        return Observable.throw({
                            status:410,
                            title:"Todo Deleted",
                            message: err.error.message
                        });
                    default: 
                        return Observable.throw({
                            status:err.status,
                            title:"Error",
                            message: err.error.message
                        });
                }
            });
    }
    
    /**
     * Get Paged results
     * @param query query params
     */
    public getPaged(query?:{[key:string]:any}){
        let queryParams = new QueryParams(Object.assign({}, query));

        return this.http
            .get(`${this.apiUrl}/api/todos`,{
                queryParams: queryParams
            })
            .flatMap(res=>{
                if(res.status===200 
                    && typeof res.body !== 'undefined' 
                    && res.body instanceof Array){
                    return Observable.of({ 
                        items:res.body,
                        count:parseInt(res.headers.get("X-Count"),10)
                    });
                }
                return Observable.throw({
                    status:res.status, 
                    error:res.body,
                    headers:res.headers 
                });
            })
            .catch(err=>{
                switch(err.status){
                    case 0:
                        return Observable.throw({
                            status:0,
                            message: err.statusText == "aborted" ? "Cancelled" : GetPagedOffline
                        });
                    case 401:
                        return Observable.throw({
                            status:401,
                            title:"Unauthorised",
                            message: err.error.message
                        });
                    case 403:
                        return Observable.throw({
                            status:403,
                            title:"Forbidden",
                            message: err.error.message
                        });
                    case 408:
                        return Observable.throw({
                            status:err.status,
                            title:"Timeout",
                            message: err.error.message
                        });
                    default: 
                        return Observable.throw({
                            status:err.status,
                            title:"Error",
                            message: err.error.message
                        });
                }
            });
    }
}