import { Task, Prisma } from '@prisma/client'
import { prisma } from './client'

async function create(
    dataParams: Prisma.TaskUncheckedCreateInput,
): Promise<Task> {
    const task = await prisma.task.create({
        data: dataParams,
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

async function deleteOne(findParams: Record<any, any>): Promise<Task> {
    const deletedTask = await prisma.task.delete({
        where: findParams,
    })

    return deletedTask
}

export default {
    create,
    find,
    findMany,
    update,
    deleteOne,
}
