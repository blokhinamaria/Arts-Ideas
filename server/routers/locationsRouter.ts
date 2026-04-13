import express from 'express'
import type { Router } from 'express'
import { getLocations } from '../controllers/locationsController.js'

export const locationsRouter: Router = express.Router()

locationsRouter.get('/', getLocations)
