import { Task, Prisma } from '@prisma/client'
import { prisma } from './client'
import { JoinAssigneeAssignment } from './taskAssignment'

type JoinCreatorTask = {
  creator: {
    apartment_id: number
  }
}

async function create(dataParams: Prisma.TaskUncheckedCreateInput): Promise<Task> {
  const task = await prisma.task.create({
    data: dataParams,
  })
  return task
}

async function find(whereParams: Prisma.TaskWhereUniqueInput): Promise<Task | null> {
  const task = await prisma.task.findFirst({
    where: whereParams,
  })
  return task
}

async function findJoinCreatorApartment(
  whereParams: Prisma.TaskWhereUniqueInput
): Promise<JoinCreatorTask | null> {
  const task = await prisma.task.findUnique({
    where: whereParams,
    select: {
      creator: {
        select: {
          apartment_id: true,
        },
      },
    },
  })
  return task
}

async function findMany(whereParams: Prisma.TaskWhereInput): Promise<Task[]> {
  const tasks = await prisma.task.findMany({
    where: whereParams,
  })
  return tasks
}

async function update(
  whereParams: Prisma.TaskWhereUniqueInput,
  dataParams: Prisma.TaskUncheckedUpdateInput
): Promise<Task> {
  const updatedTask = await prisma.task.update({
    where: whereParams,
    data: dataParams,
  })
  return updatedTask
}

async function deleteOne(whereParams: Prisma.TaskWhereUniqueInput): Promise<Task> {
  const deletedTask = await prisma.task.delete({
    where: whereParams,
  })

  return deletedTask
}

async function deleteMany(whereParams: Prisma.TaskWhereInput): Promise<number> {
  const deleteMany = await prisma.task.deleteMany({
    where: whereParams,
  })
  return deleteMany.count
}

async function deleteAll(): Promise<number> {
  const count = await deleteMany({})
  return count
}

export async function updateTaskAssignmentOrders(
  usernamesOrder: string[],
  joinAssigneeAssignments: JoinAssigneeAssignment[]
): Promise<void> {
  await prisma.$transaction(
    usernamesOrder.map((username, i) =>
      prisma.taskAssignment.update({
        where: {
          id: joinAssigneeAssignments.find(
            (assignment) => assignment.assignee.username === username
          ).id,
        },
        data: {
          order: i,
        },
      })
    )
  )
}

export default {
  create,
  find,
  findJoinCreatorApartment,
  findMany,
  update,
  deleteOne,
  deleteMany,
  deleteAll,
}
