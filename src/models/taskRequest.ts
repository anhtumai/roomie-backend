import { TaskRequest, Prisma, Task, RequestType } from '@prisma/client'
import { Profile } from './account'

import { prisma } from './client'

type JoinAssigneeRequest = {
  id: number
  state: RequestType
  assignee: Profile
}
export type JoinTaskNAssigneeRequest = JoinAssigneeRequest & {
  task: Task
}

export type JoinTaskRequest = {
  id: number
  state: RequestType
  task: Task
}

type ResponseTaskRequest = {
  task: Task
  requests: JoinAssigneeRequest[]
}

function toResponseTaskRequests(inputs: JoinTaskNAssigneeRequest[]): ResponseTaskRequest[] {
  const taskMap: Map<number, Task> = new Map()
  const requestsMap: Map<number, JoinAssigneeRequest[]> = new Map()

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
        assignee: queryRequest.assignee,
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

async function findJoinAssigneeRequest(
  whereParams: Prisma.TaskRequestWhereUniqueInput,
): Promise<JoinAssigneeRequest | null> {
  const displayRequest = await prisma.taskRequest.findUnique({
    where: whereParams,
    select: {
      id: true,
      state: true,
      assignee: {
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

async function findJoinTaskNAssigneeRequests(
  whereParams: Prisma.TaskRequestWhereInput,
): Promise<JoinTaskNAssigneeRequest[]> {
  const taskRequests = await prisma.taskRequest.findMany({
    where: whereParams,
    select: {
      id: true,
      assignee: {
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
  const assigneeIdsParams = memberIds.map((id) => ({
    assignee_id: id,
  }))
  const taskRequests = await findJoinTaskNAssigneeRequests({
    OR: assigneeIdsParams,
  })
  return toResponseTaskRequests(taskRequests)
}

async function findResponseTaskRequest(
  whereParams: Prisma.TaskRequestWhereInput,
): Promise<ResponseTaskRequest | null> {
  const taskRequests = await findJoinTaskNAssigneeRequests(whereParams)
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
  findJoinAssigneeRequest,
  findResponseTaskRequest,
  findResponseTaskRequests,
  createMany,
  update,
  updateMany,
  deleteMany,
  deleteAll,
}
