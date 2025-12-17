import express from 'express'
import type { Router } from 'express'
import { getUpcomingEvents, getMonthEvents } from '../controllers/eventsController'

export const eventsRouter:Router = express.Router()

eventsRouter.get('/upcoming', getUpcomingEvents)
eventsRouter.get('/', getMonthEvents)