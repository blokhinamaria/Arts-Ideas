import express from 'express'
import type { Router } from 'express'
import { getUpcomingEvents, getMonthEvents, getAdminEvents, updateAdminEvent, getAcademicYears, getAllEvents } from '../controllers/eventsController.js'
import { getPendingEvents, updatePendingEvent, deletePendingEvent, publishPendingEvent } from '../controllers/pendingEventsController.js'
import { authMiddleware } from '../controllers/authController.js'

export const eventsRouter:Router = express.Router()

eventsRouter.get('/admin/academic-years', authMiddleware, getAcademicYears)
eventsRouter.get('/admin/all', authMiddleware, getAllEvents)
eventsRouter.get('/admin', authMiddleware, getAdminEvents)
eventsRouter.put('/admin/:id', authMiddleware, updateAdminEvent)

eventsRouter.get('/pending', authMiddleware, getPendingEvents)
eventsRouter.put('/pending/:id', authMiddleware, updatePendingEvent)
eventsRouter.delete('/pending/:id', authMiddleware, deletePendingEvent)
eventsRouter.post('/pending/:id/publish', authMiddleware, publishPendingEvent)
eventsRouter.get('/upcoming', getUpcomingEvents)
eventsRouter.get('/', getMonthEvents)