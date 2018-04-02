import { Observable } from "rxjs/Observable";

export class SecurityService {

    public loginWithPasswordFlow(username:string, password:string) : Observable<any>{
        throw new Error("Not implemented");
    }

    public externalLogin(provider:string) : Observable<any>{
        throw new Error("Not implemented");
    }
}

 export class LoginError{
    public message:string;
 }