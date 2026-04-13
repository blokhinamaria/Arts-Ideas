import express from 'express'
import type { Router } from 'express'
import { submitNewEvent } from '../controllers/submitEventController.js'

export const submitEventRouter: Router = express.Router()

submitEventRouter.post('/', submitNewEvent)
