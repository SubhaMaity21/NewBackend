class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors=[],
        stack = ""
    ){
        super(message) // The Error class needs to know the error message so it can set it on the error object
        this.statusCode = statusCode;
        this.data = null; // This is likely used to indicate that no valid data is associated with the error. This helps keep error responses clean and standardized
        this.success = false;
        this.errors = errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor) // ensures that the stack trace starts at the point where the ApiError object was instantiated, excluding the ApiError constructor itself.
        }
    }
    
}

export {ApiError}