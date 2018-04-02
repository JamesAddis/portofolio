import{ Subscription } from "rxjs/Subscription";
import {
    Router, 
    NavigationCancelEvent, 
    NavigationEndEvent,
    NavigationBeginEvent, 
    NavigationErrorEvent
} from "@angular/router";

import {LoggerService, ILogger} from "../services/LoggerService";

/**
 * To Do Application Component
 */
export class AppComponent{

    /**
     * Private Members
     */

    /**
     * Logger to report errors
     */
    private readonly logger:ILogger;

    /**
     * Private Fields
     */

    /**
     * Router Events Subscription
     */
    private routeEventsSubscription:Subscription;

    /**
     * New Years Subscription
     */
    private newYearsSubscription:Subscription;
    
    /**
     * Public Fields
     */

    /**
     * Status value
     */
    public status:string;

    public year:number;

    /**
     * Constructor
     * @param router router service
     * @param loggerService logger service
     */
    constructor(private router:Router, loggerService:LoggerService){
        this.logger = loggerService.getLogger("AppComponent");
    }

    /**
     * App Component Initialiser
     */
    public ngOnInit(){
        // connect up to router events to show navigation animations
        this.routeEventsSubscription = this.router
            .events
            .subscribe(ev=>{
                // change status on relevant events
                if(ev instanceof NavigationBeginEvent){
                    this.status = "loading";
                } else if(ev instanceof NavigationCancelEvent){
                    this.status = "active";
                } else if(ev instanceof NavigationCompletedEvent){
                    this.status = "active";
                } else if(ev instanceof NavigationErrorEvent){
                    // navigate to error page
                    this.router.navigateTo("/error",{skipLocationChange:true});
                    this.status = "active";
                } else{
                    this.status = "active";
                }
            }, err=>{
                // log error
                if(typeof err !== 'undefined'){
                    this.logger.error({log:'Route event error', error:err});    
                }
                // navigate to error page
                this.router.navigateTo("/error",{skipLocationChange:true});
                this.status = "active";
            },()=>{
                this.routeEventsSubscription = null;
            });
    }

    /**
     * App Component Deconstructor
     */
    public ngOnDestroy(){
        if(typeof this.routeEventsSubscription !== 'undefined' 
        && this.routeEventsSubscription instanceof Subscription){
            this.routeEventsSubscription.unsubscribe();
        }
        if(typeof this.newYearsSubscription !== 'undefined'
        && this.newYearsSubscription instanceof Subscription){
            this.newYearsSubscription.unsubscribe();
        }
    }
}