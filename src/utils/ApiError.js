class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.message = message,
        this.statusCode = statusCode,
        this.errors = errors
        this.data = null
        this.success = false
        if(stack){
            // to make the stack trace more readable
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this , this.constructor)
        }
    }
}