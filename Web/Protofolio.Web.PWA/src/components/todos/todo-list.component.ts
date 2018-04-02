import{ToDoReadModel}from "./../../models/ToDoReadModel";
import{Subscription}from "rxjs/Subscription";
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import{ILogger, LoggerService} from "./../../services/todo.logger.service";
import { IToDoService, ToDoService } from "../../services/todo.service";
export class ToDoListComponent{
    private readonly logger:ILogger;
    private readonly service: IToDoService;

    private queryParamsSubscription:Subscription;
    private getPageDetailsSubscription:Subscription;
    private routeDataSubscription:Subscription;
    private statusUpdatesSubscription: Subscription;

    public items:ToDoReadModel[] =[];
    public count:number = 0;

    public page:number =1;
    public newPage:number =1;
    public pageSize:number = 20;
    public searchs:string[] =[];
    public filters:string[] = [];
    public sorts:string[] =[];

    public message:string = "";
    public messageType:string = "";
    
    public status:string = "loading";
    public errorTitle:string = "";
    public errorLink:string = "";

    constructor(
        service:ToDoService,
        loggerService:LoggerService,
        private router:Router, 
        private route:ActivatedRoute){
        this.logger = loggerService.getLogger("ToDoListComponent");
        this.service = service;
    }

    public get maxPage(){
        return this.count > 0 ? Math.ceil(this.count / this.pageSize) : 1;
    }

    public ngOnInit(){
       this.routeDataSubscription = this.route
        .data
        .subscribe((resolvedData)=>{
            this.items = resolvedData.items;
            this.count = resolvedData.count;
            this.status = "active";
        },err=>{
            let errorDialogData= {
                data:{
                    title: "Error",
                    message:"Sorry! An error occurred whilst attempting to get list details",
                    actions:[
                        {message:"Retry", result:true},
                        {message:"Dismiss", result:false}
                    ]
                }
            };
            if(typeof err === 'undefined'){

            } else if(err instanceof Error){
                this.logger.error(err);
            } else if(typeof err ==='object' && Object.keys(err).some(x=>x == "status")){
                switch(err.status){
                    case 0: 
                    case 400:
                    case 401:
                    case 403:
                    case 408:
                    case 500:
                    case 503:
                    default: break;
                }
            }
        },()=>{this.routeDataSubscription = null;});
    }

    public ngOnDestroy(){
        if(typeof this.statusUpdatesSubscription !=='undefined'
        && this.statusUpdatesSubscription instanceof Subscription){
            this.statusUpdatesSubscription.unsubscribe();
        }
        if(typeof this.getPageDetailsSubscription !=='undefined'
        && this.getPageDetailsSubscription instanceof Subscription){
            this.getPageDetailsSubscription.unsubscribe();
        }
        if(typeof this.queryParamsSubscription !=='undefined'
        && this.queryParamsSubscription instanceof Subscription){
            this.queryParamsSubscription.unsubscribe();
        }
        if(typeof this.routeDataSubscription !=='undefined'
        && this.routeDataSubscription instanceof Subscription){
            this.routeDataSubscription.unsubscribe();
        }
    }
} 