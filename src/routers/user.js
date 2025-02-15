const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')
const router = new express.Router()



router.post('/users', async (req, res) => {
    const user = new User(req.body)
    
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token})
    } catch (error) {
        res.status(400).send(error)
    }
})

//Handle a login request for a user provided email and password
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user , token})
    } catch (error) {
        res.status(400).send()
    }
})

//Log out an authenticated user from a single session
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send('Logged out')
    } catch (error) {
        console.log('Something broke...')
        res.status(500).send()
    }
})

//Log out an authenticated user from all sessions
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []//Set tokens array to be empty
        await req.user.save()

        res.send('Logged out from all devices')
    } catch (error) {
        res.status(500).send()
    }
    
})

//Get user profile
router.get('/users/me', auth , async (req, res) => {
   res.send(req.user)
    
})


//Update existing user
router.patch('/users/me', auth, async (req, res) => {
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!'})
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        
        res.send(req.user)
    } catch (error) {
        res.status(400).send(error)
    }
})

//Delete user

router.delete('/users/me', auth, async (req, res) => {
    const user = req.user
    try {
        await user.remove()
        sendCancellationEmail(user.email, user.name)
        res.send(req.user)
    } catch (error) {
        res.status(500).send(error)
    }
})

//upload profile picture
const imageUpload = multer({
        limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('File must have a .jpg, .jpeg or .png extension'))
        }
    cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, imageUpload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height:250}).png().toBuffer()
    req.user.avatar = buffer
   await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send(error)
    }
})

router.get('/users/:id/avatar', async (req, res) => {

    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch (error) {
        res.status(404).send()
    }
})


module.exports = router