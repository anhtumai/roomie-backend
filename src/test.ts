import taskRequestsModels, { QueryTaskRequest } from './models/taskRequest'

import { prisma } from './models/client'
import { Task } from '@prisma/client'
import { Profile } from './models/account'

type DisplayTaskRequest = Task & {
    pendingBy: Profile[]
    acceptedBy: Profile[]
    rejectedBy: Profile[]
}

function transformInformation(
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

(async () => {
    const results = await taskRequestsModels.findMany({
        OR: [
            {
                assigner_id: 274,
            },
            {
                assigner_id: 275,
            },
            {
                assigner_id: 276,
            },
        ],
    })
    transformInformation(results)

    await prisma.$disconnect()
})()
