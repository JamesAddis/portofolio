import {Component} from "@angular/core";
import {FormGroup, FormControl, Validators } from "@angular/forms";
import {Subscription} from "rxjs/Subscription";
import {MatDialogRef} from "@angular/material";
import * as Messages from "./../../constants/login.messages";
import {SecurityService, LoginError} from "./../../services/security.service";

@Component({
    selector:"todo-unauthorised-dialog",
    templateUrl:"./unauthorised-dialog.component.html"
})
export class UnauthorisedDialogComponent {
    private loginSubscription: Subscription;
    private loginStatusSubscription: Subscription;

    public status:string = "active";
    public inputForm:FormGroup;
    public message:string;
    public messageType:string;
    constructor(public dialogRef: MatDialogRef<UnauthorisedDialogComponent>, private service: SecurityService) { }

    public login() {
        this.loginSubscription = this.service.loginWithPasswordFlow(
            this.inputForm.controls.Username.value, 
            this.inputForm.controls.Password.value)
            .subscribe(()=>{this.dialogRef.close(true);},
            err=>{
                if(typeof err !== 'undefined' 
                && err instanceof LoginError){
                    this.messageType= "error";
                    this.message =err.message;
                    return;
                }
                if(typeof err === 'object' 
                && Object.keys(err).some(x=>x == "status")){
                    switch(err.status){
                        case 0:
                            this.messageType = "warning";
                            this.message = Messages.LoginOffline;
                            this.status = "active";
                            return;
                        case 400: 
                        return;
                        case 408: 
                            this.messageType = "warning";
                            this.message = err.message || Messages.LoginTimeout;
                            this.status = "active";
                            return;
                        case 503: 
                            this.message = err.message || Messages.LoginServerUnavailable;
                            this.messageType = "warning";
                            this.status = "active";
                            return;
                        case 500: 
                            this.messageType = "error";
                            this.message = err.message || Messages.LoginError;
                            this.status = "active";
                            return;
                        default: break;                    
                    }
                }
                this.dialogRef.close(err);
            }, 
            ()=>{this.loginSubscription = null;});
    }

    public submit($event:any){
        $event.stopPropogation();
        this.login();
        return false;
    }

    public dismiss($event:any) {
        $event.stopPropogation();
        this.dialogRef.close(false);
        return false;
    }

    public ngOnInit(){
        this.inputForm = new FormGroup({
            Username: new FormControl('', [Validators.required]),
            Password: new FormControl('', [Validators.required])
        });
    }

    public ngOnDestroy(){
        if(typeof this.loginSubscription !== 'undefined' 
        && this.loginSubscription instanceof Subscription){
            this.loginSubscription.unsubscribe();
        }
    }
}