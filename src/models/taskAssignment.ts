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

async function createMany(
    inputs: Prisma.TaskAssignmentUncheckedCreateInput[],
): Promise<number> {
    const createMany = await prisma.taskAssignment.createMany({
        data: inputs,
    })
    return createMany.count
}

export default {
    createMany,
}
