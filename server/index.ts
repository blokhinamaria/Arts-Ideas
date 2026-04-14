import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import type { Express, Request, Response } from 'express'
import { eventsRouter } from './routers/eventsRouter.js';
import { locationsRouter } from './routers/locationsRouter.js';
import { submitEventRouter } from './routers/submitEventRouter.js';
import { authRouter } from './routers/authRouter.js';

const app:Express = express();

const PORT = process.env.PORT || 3000;

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        credentials: true
    })
);
app.use(express.json())
app.use(cookieParser());

app.use('/auth', authRouter)
app.use('/api/events', eventsRouter)
app.use('/api/locations', locationsRouter)
app.use('/api/submit-event', submitEventRouter)

app.use((_req:Request, res:Response<{message: string}>):void => {
    res.status(404).json({message: 'No endpoint found'})
})

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, ():void => console.log(`Listening on port ${PORT}`))
}

export default app



