import { TaskRequest, Prisma } from '@prisma/client'

import { prisma } from './client'

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
    createMany,
    update,
    updateMany,
}
