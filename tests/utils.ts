import supertest, { SuperTest } from 'supertest'

import accountModel from '../src/models/account'
import apartmentModel from '../src/models/apartment'
import invitationModel, { PendingInvitation } from '../src/models/invitation'
import taskAssignmentModel from '../src/models/taskAssignment'
import taskRequestModel from '../src/models/taskRequest'
import taskModel from '../src/models/task'

async function deleteAll(): Promise<void> {
    await taskAssignmentModel.deleteAll()
    await taskRequestModel.deleteAll()
    await taskModel.deleteAll()
    await invitationModel.deleteAll()
    await apartmentModel.deleteAll()
    await accountModel.deleteAll()
}

async function registerUser(
    api: SuperTest<supertest.Test>,
    user: any,
): Promise<void> {
    await api
        .post('/api/register')
        .send(user)
        .expect(201)
        .expect('Content-Type', /application\/json/)
}

async function registerUsers(
    api: SuperTest<supertest.Test>,
    users: any[],
): Promise<void> {
    for (const user of users) {
        await registerUser(api, user)
    }
}

async function login(
    api: SuperTest<supertest.Test>,
    user: { username: string; password: string },
): Promise<string> {
    const { username, password } = user
    const response = await api
        .post('/api/login')
        .send({ username, password })
        .expect(200)
    return response.body.token
}

async function createNewApartment(
    api: SuperTest<supertest.Test>,
    creatorToken: string,
    apartmentName: string,
): Promise<void> {
    await api
        .post('/api/apartments')
        .set('Authorization', 'Bearer ' + creatorToken)
        .send({ name: apartmentName })
        .expect(201)
}

async function sendInvitation(
    api: SuperTest<supertest.Test>,
    invitorToken: string,
    inviteeUsername: string,
): Promise<PendingInvitation> {
    const response = await api
        .post('/api/invitations')
        .set('Authorization', 'Bearer ' + invitorToken)
        .send({ username: inviteeUsername })
        .expect(201)
    return response.body
}

async function sendInvitations(
    api: SuperTest<supertest.Test>,
    invitorToken: string,
    inviteeUsernames: string[],
): Promise<number[]> {
    const invitations = []
    for (const inviteeUsername of inviteeUsernames) {
        const invitation = await sendInvitation(api, invitorToken, inviteeUsername)
        invitations.push(invitation.id)
    }
    return invitations
}

async function acceptInvitation(
    api: SuperTest<supertest.Test>,
    inviteeToken: string,
    invitationId: number,
): Promise<void> {
    await api
        .post(`/api/invitations/${invitationId}/accept`)
        .set('Authorization', 'Bearer ' + inviteeToken)
        .expect(200)
}

async function handleTaskRequest(
    api: SuperTest<supertest.Test>,
    token: string,
    requestId: number,
    state: 'pending' | 'accepted' | 'rejected',
): Promise<void> {
    await api
        .patch(`/api/taskrequests/${requestId}`)
        .set('Authorization', 'Bearer ' + token)
        .send({ state })
        .expect(200)
}

function sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export default {
    deleteAll,
    registerUser,
    registerUsers,
    login,
    createNewApartment,
    sendInvitation,
    sendInvitations,
    acceptInvitation,
    handleTaskRequest,
    sleep,
}
