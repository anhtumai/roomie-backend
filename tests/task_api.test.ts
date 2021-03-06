import supertest from 'supertest'

import app from '../src/app'
import { prisma } from '../src/models/client'

import taskRequestModel from '../src/models/taskRequest'
import taskAssignmentModel from '../src/models/taskAssignment'
import taskModel from '../src/models/task'

import utils from './utils'
import users from './users'

const api = supertest(app)

const user1 = users.find((user) => user.username === 'anhtumai')
const testuser1 = users.find((user) => user.username === 'firsttestuser')
const testuser2 = users.find((user) => user.username === 'secondtestuser')
const testuser3 = users.find((user) => user.username === 'thirdtestuser')

const apartmentName = 'Hoas Family Apartment'

let user1Token = ''
let testuser1Token = ''
let testuser2Token = ''
let testuser3Token = ''

const taskRequest1 = {
  name: 'Clean the bathroom',
  description: 'clean the toilet, ...',
  frequency: 1,
  difficulty: 6,
  start: '01 Sep 2021',
  end: '01 Sep 2022',
  assignees: ['anhtumai', 'firsttestuser', 'secondtestuser'],
}

beforeAll(async () => {
  await utils.deleteAll()

  await utils.registerUsers(api, [user1, testuser1, testuser2, testuser3])

  user1Token = await utils.login(api, user1)
  testuser1Token = await utils.login(api, testuser1)
  testuser2Token = await utils.login(api, testuser2)
  testuser3Token = await utils.login(api, testuser3)

  await utils.createNewApartment(api, user1Token, apartmentName)

  const invitationIds = await utils.sendInvitations(api, user1Token, [
    testuser1.username,
    testuser2.username,
  ])

  await utils.acceptInvitation(api, testuser1Token, invitationIds[0])
  await utils.acceptInvitation(api, testuser2Token, invitationIds[1])
})

describe('POST /api/tasks', () => {
  test('create task should return 400 if you are not member of apartment', async () => {
    await api
      .post('/api/tasks')
      .set('Authorization', 'Bearer ' + testuser3Token)
      .expect(400)
  })
  test('create task with invalid information', async () => {
    await api
      .post('/api/tasks')
      .set('Authorization', 'Bearer ' + testuser1Token)
      .send({ ...taskRequest1, assignees: ['nonexisting1', 'nonexisting2'] })
      .expect(400)
  })
  test('create valid task', async () => {
    await api
      .post('/api/tasks')
      .set('Authorization', 'Bearer ' + testuser1Token)
      .send(taskRequest1)
      .expect(201)
    const allRequests = await taskRequestModel.findMany({})
    expect(allRequests.length).toEqual(3)
    expect(allRequests.every((request) => request.state === 'pending')).toBeTruthy()
  })
})

describe('PUT /api/tasks/:id', () => {
  let taskId = 0
  test('get task ID', async () => {
    const response = await api.get('/api/me/tasks').set('Authorization', 'Bearer ' + user1Token)

    taskId = Number(response.body.requests[0].task.id)
  })
  test('change task property should return 200', async () => {
    const updatedTaskRequest1 = {
      ...taskRequest1,
      frequency: 2,
    }
    await api
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', 'Bearer ' + user1Token)
      .send(updatedTaskRequest1)
      .expect(200)

    const task = await taskModel.find({ id: taskId })
    expect(task.frequency).toEqual(2)
  })
  test('change task property with invalid value should return 400', async () => {
    const updatedTaskRequest1 = {
      ...taskRequest1,
      frequency: 'invalid',
    }
    await api
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', 'Bearer ' + user1Token)
      .send(updatedTaskRequest1)
      .expect(400)
  })
})

describe('PATCH /api/taskrequests/:id', () => {
  let user1RequestId = 0
  let testuser1RequestId = 0
  let testuser2RequestId = 0
  test('get list of requests', async () => {
    const response = await api
      .get('/api/me/apartment')
      .set('Authorization', 'Bearer ' + testuser1Token)
      .expect(200)
    const requests = response.body.task_requests[0].requests
    user1RequestId = Number(
      requests.find((request) => request.assignee.username === user1.username).id,
    )
    testuser1RequestId = Number(
      requests.find((request) => request.assignee.username === testuser1.username).id,
    )
    testuser2RequestId = Number(
      requests.find((request) => request.assignee.username === testuser2.username).id,
    )
  })
  test('accept a request not belong to user should return 400', async () => {
    await api
      .patch(`/api/taskrequests/${testuser1RequestId}`)
      .set('Authorization', 'Bearer ' + testuser3Token)
      .send({ state: 'accepted' })
      .expect(403)
  })
  test('patch with invalid state should return 400', async () => {
    await api
      .patch(`/api/taskrequests/${testuser1RequestId}`)
      .set('Authorization', 'Bearer ' + testuser1Token)
      .send({ state: 'invalid' })
      .expect(400)
  })
  test('valid accept', async () => {
    await utils.handleTaskRequest(api, user1Token, user1RequestId, 'accepted')
    await utils.handleTaskRequest(api, testuser1Token, testuser1RequestId, 'accepted')
  })
  test('if all requests are accepted, generate task assignment', async () => {
    await utils.handleTaskRequest(api, testuser2Token, testuser2RequestId, 'accepted')
    await utils.sleep(1000)

    const allRequests = await taskRequestModel.findMany({})
    expect(allRequests.length).toEqual(0)

    const allAssignments = await taskAssignmentModel.findJoinTaskAssignments({})
    expect(allAssignments.length).toEqual(3)
  })
})

describe('PUT /api/tasks/:id/order', () => {
  let taskId = 0
  const newOrder = [testuser2.username, testuser1.username, user1.username]
  test('get task ID', async () => {
    const response = await api.get('/api/me/tasks').set('Authorization', 'Bearer ' + user1Token)

    taskId = Number(response.body.assignments[0].task.id)
  })
  test('except creator and admin, no-one can change order of task assignment', async () => {
    await api
      .put(`/api/tasks/${taskId}/order`)
      .set('Authorization', 'Bearer ' + testuser2Token)
      .send({ order: newOrder })
      .expect(403)

    await api
      .put(`/api/tasks/${taskId}/order`)
      .set('Authorization', 'Bearer ' + user1Token)
      .send({ order: newOrder })
      .expect(200)

    await api
      .put(`/api/tasks/${taskId}/order`)
      .set('Authorization', 'Bearer ' + testuser1Token)
      .send({ order: newOrder })
      .expect(200)

    const responseTaskAssignment = await taskAssignmentModel.findResponseTaskAssignment({
      task_id: taskId,
    })

    const joinTaskAssignments = responseTaskAssignment.assignments
    joinTaskAssignments.sort((asn1, asn2) => asn1.order - asn2.order)
    const selectedOrder = joinTaskAssignments.map((assignment) => assignment.assignee.username)
    expect(selectedOrder).toEqual(newOrder)
  })
  test('change order without all assignees usernames will return 400', async () => {
    await api
      .put(`/api/tasks/${taskId}/order`)
      .set('Authorization', 'Bearer ' + testuser1Token)
      .send({ order: [testuser1.username, user1.username] })
      .expect(400)
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})
