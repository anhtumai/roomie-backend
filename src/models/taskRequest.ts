import { TaskRequest, Prisma, Task, RequestType } from '@prisma/client'
import { Profile } from './account'

import { prisma } from './client'

export type QueryTaskRequest = {
    id: number
    state: RequestType
    assigner: Profile
    task: Task
}

type DisplayRequest = {
    id: number
    state: RequestType
    assigner: Profile
}

type ResponseTaskRequest = {
    task: Task
    requests: DisplayRequest[]
}

function toResponseTaskRequest(
    inputs: QueryTaskRequest[],
): ResponseTaskRequest[] {
    const taskMap: Map<number, Task> = new Map()
    const requestsMap: Map<number, DisplayRequest[]> = new Map()

    for (const queryRequest of inputs) {
        const taskId = queryRequest.task.id
        if (!taskMap.has(taskId)) {
            taskMap.set(taskId, queryRequest.task)
            requestsMap.set(taskId, [])
        }
        const updatedDisplayRequests = [
            ...requestsMap.get(taskId),
            {
                id: queryRequest.id,
                state: queryRequest.state,
                assigner: queryRequest.assigner,
            },
        ]
        requestsMap.set(taskId, updatedDisplayRequests)
    }

    return Array.from(taskMap.keys()).map((taskId) => ({
        task: taskMap.get(taskId),
        requests: requestsMap.get(taskId),
    }))
}

async function findMany(
    whereParams: Prisma.TaskRequestWhereInput,
): Promise<QueryTaskRequest[]> {
    const taskrequests = await prisma.taskRequest.findMany({
        where: whereParams,
        select: {
            id: true,
            assigner: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                },
            },
            task: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    frequency: true,
                    difficulty: true,
                    start: true,
                    end: true,
                    creator_id: true,
                },
            },
            state: true,
        },
        orderBy: {
            task_id: 'asc',
        },
    })
    return taskrequests
}

async function findDisplayRequest(
    whereParams: Prisma.TaskRequestWhereUniqueInput,
): Promise<DisplayRequest | null> {
    const displayRequest = await prisma.taskRequest.findUnique({
        where: whereParams,
        select: {
            id: true,
            state: true,
            assigner: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                },
            },
        },
    })
    return displayRequest
}

async function findResponseTaskRequests(
    memberIds: number[],
): Promise<ResponseTaskRequest[]> {
    const assignerIdsParams = memberIds.map((id) => ({
        assigner_id: id,
    }))
    const taskrequests = await findMany({ OR: assignerIdsParams })
    return toResponseTaskRequest(taskrequests)
}

async function createMany(
    inputs: Prisma.TaskRequestUncheckedCreateInput[],
): Promise<number> {
    const createMany = await prisma.taskRequest.createMany({
        data: inputs,
    })
    return createMany.count
}

async function update(
    whereParams: Prisma.TaskRequestWhereUniqueInput,
    dataParams: Prisma.TaskRequestUncheckedUpdateInput,
): Promise<TaskRequest> {
    const updatedRequest = await prisma.taskRequest.update({
        where: whereParams,
        data: dataParams,
    })

    return updatedRequest
}

async function updateMany(
    whereParams: Prisma.TaskRequestWhereUniqueInput,
    dataParams: Prisma.TaskRequestUncheckedUpdateInput,
): Promise<number> {
    const updateUsers = await prisma.taskRequest.updateMany({
        where: whereParams,
        data: dataParams,
    })
    return updateUsers.count
}

export default {
    findDisplayRequest,
    findMany,
    findResponseTaskRequests,
    createMany,
    update,
    updateMany,
}
