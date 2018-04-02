import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material";
@Component({
    selector:"todo-error-dialog",
    templateUrl:"./error-dialog.component.html"
})
export class ErrorDialogComponent{
    public title:string = "Error";
    public message:string ="Sorry! An error occurred";

    public constructor(@Inject(MAT_DIALOG_DATA) public data: any){

    }

    public ngOnInit(){
        if(typeof this.data === 'object'){
            if(Object.keys(this.data).some(x=> x== "title")){
                this.title =this.data.title;
            }
            if(Object.keys(this.data).some(x=> x== "message")){
                this.message =this.data.message;
            }
        }
    }
}