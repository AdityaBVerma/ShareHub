// import { Promise } from "mongoose"

const asyncHandler = async (requestHandler) => {
    return(req, res, next)=>{
        Promise
        .resolve(asyncHandler(req,res,next))
        .catch((err)=>next(err))
    }
}

export default asyncHandler
