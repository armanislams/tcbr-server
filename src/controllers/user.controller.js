import User from "../model/User"

export const createUser = async (req, res) => {
    const {name,email,password,role}= req.body
    if(!name || !email || !password || !role){
        return res.status(400).json({success:false,message:"All fields are required"})
    }
    try {
        const user = await User.create({name,email,password,role})
        res.json({success:true,data:user})
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:"failed to create user"})
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
        res.send(users)
    } catch (error) {
        console.log(error)
        res.status(500).send({ error: "Failed to get users" })
    }
}

export const getUser = async (req, res) => {
    const {id}= req.params
    try {
        const user = await User.findById(id)
        if(!user){
            return res.status(404).json({success:false,message:"user not found"})
        }
        res.json({success:true,data:user})
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:"failed to get user"})
    }
}

export const updateUser = async (req, res) => {
    const {id}= req.params
    const updatedUser = req.body
    try {
        const user = await User.findByIdAndUpdate(id, updatedUser, { new: true })
        if(!user){
            return res.status(404).json({success:false,message:"user not found"})
        }
        res.json({success:true,data:user})
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:"failed to update user"})
    }
}

export const updateUserRole = async(req,res)=>{
    const {id}= req.params
    const {role}= req.body
    try {
        const user = await User.findByIdAndUpdate(id, { role }, { new: true })
        if(!user){
            return res.status(404).json({success:false,message:"user not found"})
        }
        res.json({success:true,data:user})
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false,message:"failed to update user role"})
    }
}

