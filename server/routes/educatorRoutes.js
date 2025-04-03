import express from 'express'
import { updateRollToEducator } from '../controllers/educatorController.js'

const educatorRouter = express.Router()

// Add educator role
educatorRouter.get('/updateRole', updateRollToEducator)

export default educatorRouter;