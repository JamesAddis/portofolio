export interface ILogger{
    debug(...args:any[]):void;
    trace(...args:any[]):void;
    log(...args:any[]):void;
    info(...args:any[]):void;
    warn(...args:any[]):void;
    error(...args:any[]): void;
    fatal(...args:any[]):void;
}

export class LoggerService{
    private readonly loggerUrl:string;

    constructor(config:{loggerUrl:string}){
        this.loggerUrl = config.loggerUrl;
    }

    public getLogger(name:string):ILogger{
        return null;
    }
    
}