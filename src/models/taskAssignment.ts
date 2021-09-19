import { Prisma, Task, TaskAssignment } from '@prisma/client'
import { Profile } from './account'

import { prisma } from './client'

type JoinAssignerAssignment = {
    id: number
    order: number
    assigner: Profile
}

type JoinTaskNAssignerAssignment = JoinAssignerAssignment & {
    task: Task
}

type ResponseTaskAssignment = {
    task: Task
    assignments: JoinAssignerAssignment[]
}

function toResponseTaskAssignments(
    inputs: JoinTaskNAssignerAssignment[],
): ResponseTaskAssignment[] {
    const taskMap: Map<number, Task> = new Map()
    const assignmentsMap: Map<number, JoinAssignerAssignment[]> = new Map()

    for (const queryAssignment of inputs) {
        const taskId = queryAssignment.task.id
        if (!taskMap.has(taskId)) {
            taskMap.set(taskId, queryAssignment.task)
            assignmentsMap.set(taskId, [])
        }
        const updatedAssignments = [
            ...assignmentsMap.get(taskId),
            {
                id: queryAssignment.id,
                order: queryAssignment.order,
                assigner: queryAssignment.assigner,
            },
        ]
        assignmentsMap.set(taskId, updatedAssignments)
    }

    return Array.from(taskMap.keys()).map((taskId) => ({
        task: taskMap.get(taskId),
        assignments: assignmentsMap.get(taskId),
    }))
}

async function findJoinTaskNAssignerAssignments(
    whereParams: Prisma.TaskAssignmentWhereInput,
): Promise<JoinTaskNAssignerAssignment[]> {
    const taskAssignments = await prisma.taskAssignment.findMany({
        where: whereParams,
        select: {
            id: true,
            order: true,
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
        },
    })
    return taskAssignments
}

async function findResponseTaskAssignments(
    memberIds: number[],
): Promise<ResponseTaskAssignment[]> {
    const assignerIdsParams = memberIds.map((id) => ({
        assigner_id: id,
    }))
    const taskAssignments = await findJoinTaskNAssignerAssignments({
        OR: assignerIdsParams,
    })
    return toResponseTaskAssignments(taskAssignments)
}

async function findResponseTaskAssignment(
    whereParams: Prisma.TaskAssignmentWhereInput,
): Promise<ResponseTaskAssignment | null> {
    const taskAssignments = await findJoinTaskNAssignerAssignments(whereParams)
    if (taskAssignments.length === 0) return null
    return toResponseTaskAssignments(taskAssignments)[0]
}

async function createMany(
    inputs: Prisma.TaskAssignmentUncheckedCreateInput[],
): Promise<number> {
    const createMany = await prisma.taskAssignment.createMany({
        data: inputs,
    })
    return createMany.count
}

async function deleteMany(
    whereParams: Prisma.TaskAssignmentWhereInput,
): Promise<number> {
    const deleteMany = await prisma.taskAssignment.deleteMany({
        where: whereParams,
    })
    return deleteMany.count
}

async function update(
    whereParams: Prisma.TaskAssignmentWhereUniqueInput,
    dataParams: Prisma.TaskAssignmentUpdateInput,
): Promise<TaskAssignment | null> {
    const updatedTask = await prisma.taskAssignment.update({
        where: whereParams,
        data: dataParams,
    })
    return updatedTask
}

export default {
    findResponseTaskAssignment,
    findResponseTaskAssignments,
    createMany,
    deleteMany,
    update,
}
