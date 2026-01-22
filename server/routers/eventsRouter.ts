import express from 'express'
import type { Router } from 'express'
import { getUpcomingEvents, getMonthEvents } from '../controllers/eventsController.js'

export const eventsRouter:Router = express.Router()

eventsRouter.get('/upcoming', getUpcomingEvents)
eventsRouter.get('/', getMonthEvents)