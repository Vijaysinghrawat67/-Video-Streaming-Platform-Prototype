const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).
        catch((error) => next(error))
    }
}



export {asyncHandler}



//                Higher Order Function......
// const asyncHandler = ( ) => {}
// aonst asyncHandler = (func) => { () =>  {} }
// aonst asyncHandler = (func) =>  async () =>  {} 


// Using Try catch
/* const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(err.code || 500).json({
            success : false,
            message : err.message
        })
    }
 } 
*/