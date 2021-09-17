import { TaskRequest, Prisma, Task, RequestType } from '@prisma/client'
import { Profile } from './account'

import { prisma } from './client'

export type QueryTaskRequest = {
    id: number
    state: RequestType
    assigner: Profile
    task: Task
}

type DisplayTaskRequest = Task & {
    pendingBy: Profile[]
    acceptedBy: Profile[]
    rejectedBy: Profile[]
}

function toDisplayTaskRequest(
    inputs: QueryTaskRequest[],
): DisplayTaskRequest[] {
    const taskMap: Map<number, Task> = new Map()
    const pendingByMap: Map<number, Profile[]> = new Map()
    const acceptedByMap: Map<number, Profile[]> = new Map()
    const rejectedByMap: Map<number, Profile[]> = new Map()

    for (const request of inputs) {
        const taskId = request.task.id
        if (!taskMap.has(taskId)) {
            taskMap.set(taskId, request.task)
            pendingByMap.set(taskId, [])
            acceptedByMap.set(taskId, [])
            rejectedByMap.set(taskId, [])
        }
        switch (request.state) {
            case 'pending': {
                const updatedPendingBy = [...pendingByMap.get(taskId), request.assigner]
                pendingByMap.set(taskId, updatedPendingBy)
                break
            }
            case 'accepted': {
                const updatedAcceptedBy = [
                    ...acceptedByMap.get(taskId),
                    request.assigner,
                ]
                acceptedByMap.set(taskId, updatedAcceptedBy)
                break
            }
            case 'rejected': {
                const updatedRejectedBy = [
                    ...rejectedByMap.get(taskId),
                    request.assigner,
                ]
                rejectedByMap.set(taskId, updatedRejectedBy)
                break
            }
        }
    }

    return Array.from(taskMap.keys()).map((taskId) => ({
        ...taskMap.get(taskId),
        pendingBy: pendingByMap.get(taskId),
        acceptedBy: acceptedByMap.get(taskId),
        rejectedBy: rejectedByMap.get(taskId),
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

async function findDisplayTaskRequests(
    memberIds: number[],
): Promise<DisplayTaskRequest[]> {
    const assignerIdsParams = memberIds.map((id) => ({
        assigner_id: id,
    }))
    const taskrequests = await findMany({ OR: assignerIdsParams })
    return toDisplayTaskRequest(taskrequests)
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
    findMany,
    findDisplayTaskRequests,
    createMany,
    update,
    updateMany,
}
