import { TaskRequest, Prisma, Task, RequestType } from '@prisma/client'
import { Profile } from './account'

import { prisma } from './client'

type JoinAssignerRequest = {
  id: number
  state: RequestType
  assigner: Profile
}
export type JoinTaskNAssignerRequest = JoinAssignerRequest & {
  task: Task
}

export type JoinTaskRequest = {
  id: number
  state: RequestType
  task: Task
}

type ResponseTaskRequest = {
  task: Task
  requests: JoinAssignerRequest[]
}

function toResponseTaskRequests(inputs: JoinTaskNAssignerRequest[]): ResponseTaskRequest[] {
  const taskMap: Map<number, Task> = new Map()
  const requestsMap: Map<number, JoinAssignerRequest[]> = new Map()

  for (const queryRequest of inputs) {
    const taskId = queryRequest.task.id
    if (!taskMap.has(taskId)) {
      taskMap.set(taskId, queryRequest.task)
      requestsMap.set(taskId, [])
    }
    const updatedRequests = [
      ...requestsMap.get(taskId),
      {
        id: queryRequest.id,
        state: queryRequest.state,
        assigner: queryRequest.assigner,
      },
    ]
    requestsMap.set(taskId, updatedRequests)
  }

  return Array.from(taskMap.keys()).map((taskId) => ({
    task: taskMap.get(taskId),
    requests: requestsMap.get(taskId),
  }))
}

async function findMany(whereParams: Prisma.TaskRequestWhereInput): Promise<TaskRequest[]> {
  const displayRequests = await prisma.taskRequest.findMany({
    where: whereParams,
  })

  return displayRequests
}

async function findJoinAssignerRequest(
  whereParams: Prisma.TaskRequestWhereUniqueInput,
): Promise<JoinAssignerRequest | null> {
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

async function findJoinTaskRequests(
  whereParams: Prisma.TaskRequestWhereInput,
): Promise<JoinTaskRequest[]> {
  const displayRequest = await prisma.taskRequest.findMany({
    where: whereParams,
    select: {
      id: true,
      state: true,
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
  return displayRequest
}

async function findJoinTaskNAssignerRequests(
  whereParams: Prisma.TaskRequestWhereInput,
): Promise<JoinTaskNAssignerRequest[]> {
  const taskRequests = await prisma.taskRequest.findMany({
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
  return taskRequests
}

async function findResponseTaskRequests(memberIds: number[]): Promise<ResponseTaskRequest[]> {
  const assignerIdsParams = memberIds.map((id) => ({
    assigner_id: id,
  }))
  const taskRequests = await findJoinTaskNAssignerRequests({
    OR: assignerIdsParams,
  })
  return toResponseTaskRequests(taskRequests)
}

async function findResponseTaskRequest(
  whereParams: Prisma.TaskRequestWhereInput,
): Promise<ResponseTaskRequest | null> {
  const taskRequests = await findJoinTaskNAssignerRequests(whereParams)
  if (taskRequests.length === 0) return null
  return toResponseTaskRequests(taskRequests)[0]
}

async function createMany(inputs: Prisma.TaskRequestUncheckedCreateInput[]): Promise<number> {
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

async function deleteMany(whereParams: Prisma.TaskRequestWhereInput): Promise<number> {
  const deleteMany = await prisma.taskRequest.deleteMany({
    where: whereParams,
  })
  return deleteMany.count
}

async function deleteAll(): Promise<number> {
  const count = await deleteMany({})
  return count
}
export default {
  findMany,
  findJoinTaskRequests,
  findJoinAssignerRequest,
  findResponseTaskRequest,
  findResponseTaskRequests,
  createMany,
  update,
  updateMany,
  deleteMany,
  deleteAll,
}
