import express from 'express'
import type { Router } from 'express'
import { getAllEvents, getMonthEvents } from '../controllers/eventsController'

export const eventsRouter:Router = express.Router()

eventsRouter.get('/', getMonthEvents)