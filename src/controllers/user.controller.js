import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";



const generateAccessAndRefreshTokens = async(userId) =>{
   try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refereshToken = user.generateRefreshToken()

      user.refereshToken = refereshToken
      await user.save({ validateBeforeSave: false })

      return { accessToken, refereshToken }



   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
   }
}

const registerUser = asyncHandler(async (req, res) => {
   // get user deatils from frintend 
   // validation  - not empty
   // check if user already exist check with username and email
   // check for images, check for avatar
   // upload them to  cloudinary, avatar
   // create user object - create call in db
   // remove password and refresh_token field from response
   // check for user creaton
   // return res

   const { fullname, email, username, password } = req.body
   //console.log("email :", email);

   if (
      // checks at once the entry is empty or nt
      [fullname, email, username, password].some((field) => field?.trim() === "")
   ) {
      throw new ApiError(400, "All fields are required")
   }

   const existedUser = await User.findOne({
      $or: [{ username }, { email }]
   })

   if (existedUser) {
      throw new ApiError(409, "User with username or email already exist")
   }

   //console.log(req.files);

   const avatarLocalPath = req.files?.avatar[0]?.path;
   //const coverImageLocalPath = req.files?.coverImage[0]?.path;

   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
   }


   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatr file is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar) {
      throw new ApiError(400, "Avatr file is required")
   }

   const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select(
      "-password -refereshToken"
   )

   if (!createdUser) {
      throw new ApiError(500, "somthing went wrong while registering the user")
   }

   return res.status(201).json(
      new ApiResponse(200, createdUser, "user registered successfully")
   )


})


const loginUser = asyncHandler(async (req, res) => {
   //request body get data
   //username or email 
   // find the user
   // password chck
   // access and refresh token generate
   //send cookie 

   const { email, username, password } = req.body
   console.log(email);

   
      if(!username && !email){ 
      throw new ApiError(400, "username or email is required")
   }


    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

   const user = await User.findOne({
      $or: [{ username }, { email }]
   })

   if (!user) {
      throw new ApiError(404, "user does not exist")
   }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
      throw new ApiError(401, "password incorrect")
   }

   const {accessToken, refereshToken } = await generateAccessAndRefreshTokens(user._id)

   const logedInUser = await User.findById(user._id).
   select("-password -refereshToken")

   const options = {
      httpOnly: true,
      secure: true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refereshToken", refereshToken, options)
   .json(
      new ApiResponse(
         200,
         {
            user: logedInUser, accessToken, refereshToken
         },
         "user logedin successfully"
      )
   )



})



const logOutUser = asyncHandler(async(req, res) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset: {
            refereshToken: 1  // removes field from document
         }
      },
      {
         new: true
      }
   )

   const options = {
      httpOnly: true,
      secure: true
   }

   return res 
   .status(200)
   .clearCookie( "accessToken",  options)
   .clearCookie( "refereshToken", options)
   .json(new ApiResponse(200, {}, "User logged out successfully"))
})


const refreshAccessToken = asyncHandler(async (req, re) => {
   const incommingRefreshToken =  req.cookies.refereshToken || req.body.refereshToken

   if(!incommingRefreshToken){
      throw new ApiError(401, "unauthorise access")
   }

   try {
      const decodedToken = jwt.verify(
         incommingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      )
   
      const user = await User.findById(decodedToken?._id)
   
      if(!user){
         throw new ApiError(401, "invalid refresh token")
      }
   
      if (incommingRefreshToken !== user?.refereshToken){
         throw new ApiError(401, "Rfresh token is expired or used")
      }
   
      const options = {
         httpOnly: true,
         secure: true
      }
   
      const {accessToken, } = await generateAccessAndRefreshTokens(user._id)
   
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refereshToken", newRefereshToken, options)
      .json(
         new ApiResponse(
            200,
            {accessToken, refereshToken: newRefereshToken},
            "Access token refreshed"
         )
      )
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token")
   }

})


const changeCurrentPassword = asyncHandler(async(req, res) => {
   const {oldPassword, newPassword} = req.body

   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
      throw new ApiError(400, "invalid old password")
   }

   user.password = newPassword
   await user.save({validateBeforeSave: false})

   return res
   .status(200)
   .json(new ApiResponse(200, {}, "password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
   return res
   .status(200)
   .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res) => {
   const {fullname, email} = req.body

   if (!fullname || !email){
      throw new ApiError(400, "alll fields are required")
   }

   const user = User.findById(
      req.user?._id,
      {
         $set: {
            fullname,
            email
         }
      },
      {new:true}
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
   const avatarLocalPath = req.file?.path

   if (!avatarLocalPath){
      throw new ApiError(400, "avatar file is missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if (!avatar.url){
      throw new ApiError(400, "error while uploading on avatar")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,

      {
         $set: {
            avatar: avatar.url
         }
      },
      {new : true}
   ).select("-password")

   return res
   .status(200)
   .json(
      new ApiResponse(200, user, "avatar updated successfully")
   )
})


const updateUserCoverImage = asyncHandler(async(req,res) => {
   const coverImageLocalPath = req.file?.path

   if (!coverImageLocalPath){
      throw new ApiError(400, "coverImage file is missing")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!coverImage.url){
      throw new ApiError(400, "error while uploading the image")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,

      {
         $set: {
            coverImage: coverImage.url
         }
      },
      {new : true}
   ).select("-password")

   return res
   .status(200)
   .json(
      new ApiResponse(200, user, "cover image updated successfully")
   )
})


const getUserChannelProfile = asyncHandler(async(req,res) => {
     const {username} = req.params

     if(!username?.trim()){
      throw new ApiError(400, "username is missing")
     }

   const channel =  await User.aggregate([
      {
         $match: {
            username : username?.toLowerCase()
         }
      },
      {
         $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
         }
      },
      {
         $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
         }
      },
      {
         $addFields: {
            subscribersCount: {
               $size : "$subscribers"
            },
            channelsSubscribedToCount: {
               $size: "$subscribedTo"
            },
            isSubscribed: {
               if: {$in: [req.user?._id, "$subscribers.subscriber"]},
               then: true,
               else: false
            }
         }
      },
      {
         $project: {
            fullname: 1,
            username: 1,
            subscribersCoun: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
          
         }
      }
   ])

   if (!channel?.length) {
      throw new ApiError(404, "channel does not exist")
   }

   return res
   .status(200)
   .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully")
   )
})

const getWatchHistory = asyncHandler(async(req, res) => {
   const user = await User.aggregate( [
      {
         $match : {
            _id: new mongoose.Types.ObjectId(req.user._id)
         }
      },
      {
         $lookup: {
            from: "vedios",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline:[  
               {
               $lookup: {
                  from : "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "owner",
                  pipeline: [
                     {
                        $project: {
                           fullname: 1,
                           username: 1,
                           avatar : 1
                        }
                     }
                  ]
               }
            },
            {
               $addFields:{
                  owner:{
                     $first: "$owner"
                  }
               }
            }
         ]
         }
      }
   ])

   return re
   .status(200)
   .json(
      new ApiResponse(
         200,
         user[0].watchHistory,
         "Watch history fetched successfully"
      )
   )
})

export {
   registerUser,
   loginUser,
   logOutUser,
   refreshAccessToken,
   getCurrentUser,
   changeCurrentPassword,
   updateUserAvatar,
   updateAccountDetails,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
}