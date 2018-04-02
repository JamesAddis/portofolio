import { Component, OnInit, Input } from "@angular/core";

@Component({
    selector: "todo-error-page",
    templateUrl:"./error-page.component.html"
})
export class ErrorPageComponent implements OnInit {
    @Input()
    public title:string = "";

    @Input()
    public message:string = "";

    @Input()
    public link:string = null;

    public get validLink(){
        return typeof this.link ==='string' && this.link.trim().length > 0;
    }

    public ngOnInit() {
        
    }
}