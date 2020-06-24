const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeEmail,sendGoodByeEmail } = require('../emails/acount')
 
const router = new express.Router()

 //Create user-------------------------
router.post('/users', async (req,res)=>{
    const user = new User(req.body)
    
    try{
       await user.save()
       sendWelcomeEmail(user.email, user.name)
       const token = await user.generateAuthToken()
       res.status(201).send({user, token})
    } catch (e){
       res.status(400).send(e)
    }   
 })

 //Login User------------------------------
 router.post('/users/login',async(req,res)=>{
   
    try{
      const user = await User.findByCredentials(req.body.email, req.body.password)
      const token = await user.generateAuthToken()
       res.send({ user,token })
    } catch (e) {
      res.status(400).send(e)
    }
 })

//logout user---------------------------------------

 router.post('/users/logout',auth,async(req,res)=>{
   try{
      req.user.tokens = req.user.tokens.filter((token)=>{
         return token.token !== req.token
      })
      await req.user.save()

      res.send()
   } catch (e) {
     res.status(500).send()
   }

 })

//Logout ALL------------------------------------------
router.post('/users/logoutAll',auth,async(req,res)=>{
  try{
   
   req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (e) {
     res.status(500).send()
  }
})

 
 //Read my profile-----------------------
 router.get('/users/me', auth , async(req,res)=>{
     res.send(req.user)
 })
 
 //Get User----------------------------
 router.get('/users/:id', async(req,res)=>{
     const _id = req.params.id
     
     try{
       const user = await User.findById(_id)
       if(!user){
          return res.status(404).send(e)
       }
 
       res.send(user)
     } catch (e){
        res.status(500).send()
     }
 
 })
 

 //Update User---------------------------
 router.patch('/users/me', auth ,async(req,res)=>{
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','email','password','age']
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))
    
    if (!isValidOperation) {
       
       return res.status(400).send({error : 'Ivalid Updates!' })

    }
 
    try{
      
      updates.forEach((update)=> req.user[update] = req.body[update])
      await req.user.save()
      res.send(req.user)

    } catch (e) {
        res.status(400).send(e)
    }
 })

 //Delete User-----------------------------------
router.delete('/users/me', auth, async (req , res)=>{
    try { 
      await req.user.remove()
      sendGoodByeEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
      res.status(500).send  
    }
 })

//User Avatar--------------------------------------

const upload = multer({
   limits: {
      fileSize : 1000000
   },
   fileFilter(req,file,cb){

      if(!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
          return cb (new Error('Please upload an Image'))
      } 

      cb(undefined, true)

    }
}) 

router.post('/users/me/avatar',auth, upload.single('avatar'),async (req,res)=>{
   
   const buffer = await sharp(req.file.buffer).resize({width : 250 , height: 250 }).png().toBuffer()
   req.user.avatar = buffer
   await req.user.save()
   res.send()
},(error,req,res,next)=>{
   res.status(400).send({error : error.message})
})

//Delete user avatar--------------------------------------------------- 
router.delete('/users/me/avatar',auth,async(req,res)=>{

   req.user.avatar = undefined
   await req.user.save()
   res.send()
})

router.get('/user/:id/avatar',async(req,res)=>{
      try {
         const user = await User.findById(req.params.id)

         if (!user || !user.avatar ) {
             throw new Error()
         }

         res.set('Content-Type','image/png')
         res.send(user.avatar)

      } catch (e){
         res.status(404).send()
      }
})

 module.exports = router