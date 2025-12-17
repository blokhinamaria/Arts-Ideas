import express from 'express'
import cors from 'cors'
import type { Express, Request, Response } from 'express'
import { eventsRouter } from './routers/eventsRouter';

const app:Express = express();

const PORT = process.env.PORT || 3000;

app.use(cors())

app.use('/api/events', eventsRouter)

app.use((req:Request, res:Response<{message: string}>):void => {
    res.status(404).json({message: 'No endpoint found'})
})

app.listen(PORT, ():void => console.log(`Listening on port ${PORT}`))
