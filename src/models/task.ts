import { Task } from '@prisma/client'
import { prisma } from './client'

export type TaskProperty = {
    name: string
    description: string
    frequency: number
    difficulty: number
    start: Date
    end: Date
}

async function create({
    name,
    description,
    frequency,
    difficulty,
    start,
    end,
}: TaskProperty): Promise<Task> {
    const task = await prisma.task.create({
        data: {
            name,
            description,
            frequency,
            difficulty,
            start,
            end,
        },
    })
    return task
}

async function find(findParams: Record<any, any>): Promise<Task | null> {
    const task = await prisma.task.findFirst({
        where: findParams,
    })
    return task
}

async function findMany(findParams: Record<any, any>): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
        where: findParams,
    })
    return tasks
}

async function updateState(
    findParams: Record<any, any>,
    newState: 'rejected' | 'confirmed',
): Promise<Task> {
    const updatedTask = await prisma.task.update({
        where: findParams,
        data: {
            state: newState,
        },
    })
    return updatedTask
}

async function update(
    findParams: Record<any, any>,
    updateData: Record<any, any>,
): Promise<Task> {
    const updatedTask = await prisma.task.update({
        where: findParams,
        data: updateData,
    })
    return updatedTask
}

export default {
    create,
    find,
    findMany,
    update,
    updateState,
}
