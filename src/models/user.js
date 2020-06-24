//Node Modules
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const sharp = require('sharp')

//Paths
const Task = require('./tasks')

const userSchema = new mongoose.Schema({
    name: {
       type: String,
       required : true,
       trim: true,
       lowercase: true
    },
  email:{
      type: String,
      unique: true ,
      required: true,
      trim: true,
      lowercase: true,
      validate(value){
          if (!validator.isEmail(value)){
              throw new Error('Email is invalid')
          }
      }
  },

  password : {
      type : String,
      required: true,
      trim: true,
     
      validate(value){
          if (!validator.isLength(value,{min:7})){
              throw new Error ('Password is to short, it must have 7 digits or more!')
          } else if (validator.equals(value,'password')){
              throw new Error ('Password canot be the word password')
          }
      }
  },
      
    age: {
      type: Number,
      default: 0,
      validate(value){
        if (value < 0) {
            throw new Error('Age must be a positive number')
        }
      }
    },
    tokens: [{
      token: {
        type: String,
        required: true
      }
    }],
      avatar : {
        type: Buffer  
      }
  } , {

    timestamps: true
})

userSchema.virtual('tasks',{
   ref: 'Task',
   localField:'_id',
   foreignField: 'owner'
})

// METODOS User Schema -------------------------------------------------------------

// Esconde informação privada------------------------------------------
userSchema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.token
  delete userObject.avatar 

  return userObject 
}


// Gera o token de autenticação do usuario -------------------------------
userSchema.methods.generateAuthToken = async function () {
   const user = this
   const token = jwt.sign({ _id: user._id.toString() },process.env.JWT_SECRET)

   user.tokens = user.tokens.concat({ token })
   await user.save()

   return token
}

// Procura as credenciais do usuario -------------------------------------
userSchema.statics.findByCredentials = async (email,password) =>{
  
   const user = await User.findOne({email})
  
   if(!user){
     throw new Error('Unable to login') 
   }
   const isMatch = await bcrypt.compare(password, user.password)

   if(!isMatch){
     throw new Error('Unable to login')
   }

   return user
}


//Password hash-----------------------------------
userSchema.pre('save',async function(next){
  const user = this
  
  if(user.isModified('password')){
      user.password = await bcrypt.hash(user.password, 8)
  }
  
  next()
})

// Deleta tasks do usuario quando o usuario 

userSchema.pre('remove', async function (next) {
  const user = this 
  await Task.deleteMany({owner: user._id })
  
  next()
})


const User = mongoose.model('User', userSchema)

module.exports = User