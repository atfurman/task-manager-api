const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

//Create Task
router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        return res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

//GET /tasks?completed=[true/false]
//Review how this works. Syntax is unclear at this stage.

//limit and skip provide support for pagination
// GET /tasks?limit=10
// GET /tasks?skip=0 
//Taken together limit and skip allow specific result ranges to be displayed
//GET / tasks?sortBy=createdAt:desc

router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
    await req.user.populate({
        path: 'tasks',
        match,
        options: {
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip),
            sort
        }
    }).execPopulate()
    res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send(error)
    }
})

//Get task by ID
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({_id, owner: req.user._id})
        
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch(error) {
        res.status(500).send(error)
    }
})

//Update task by ID
router.patch('/tasks/:id', auth, async (req, res) => {
    // Define allowed operations
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description','completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates'})
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id})
  
        if (!task) {
            return res.status(404).send()
        } 
        
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

//Delete task

router.delete('/tasks/:id', auth, async (req, res) => {
    try{
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        
        if (!task) {
           return res.status(404).send()
        }
        
        res.send(task)
    } catch(error) {
        res.status(500).send(error)
    }
})

module.exports = router