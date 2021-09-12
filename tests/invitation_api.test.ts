import supertest from 'supertest'

import app from '../src/app'
import { prisma } from '../src/models/client'

import aprtmentModel from '../src/models/apartment'
import invitationModel, { PendingInvitation } from '../src/models/invitation'
import accountModel from '../src/models/account'
import membershipModel from '../src/models/membership'

import users from './users'
import apartmentModel from '../src/models/apartment'

const api = supertest(app)

async function registerUser(user: any): Promise<void> {
    await api
        .post('/api/register')
        .send(user)
        .expect(201)
        .expect('Content-Type', /application\/json/)
}

async function login(username: string, password: string): Promise<string> {
    const response = await api
        .post('/api/login')
        .send({ username, password })
        .expect(200)
    return response.body.token
}

async function getAllInvitations(token: string): Promise<PendingInvitation[]> {
    const response = await api
        .get('/api/invitation')
        .set('Authorization', 'Bearer ' + token)
        .expect(200)
    return response.body.data
}

async function sendInvitation(
    invitorToken: string,
    inviteeUsername: string,
): Promise<PendingInvitation> {
    const response = await api
        .post('/api/invitation')
        .set('Authorization', 'Bearer ' + invitorToken)
        .send({ username: inviteeUsername })
        .expect(201)
    return response.body
}

const user1 = users.find((user) => user.username === 'anhtumai')
const testuser1 = users.find((user) => user.username === 'firsttestuser')
const testuser2 = users.find((user) => user.username === 'secondtestuser')
const testuser3 = users.find((user) => user.username === 'thirdtestuser')

const apartmentName = 'Hoas Family Apartment'

let user1Token = ''
let testuser1Token = ''
let testuser2Token = ''
let testuser3Token = ''

beforeAll(async () => {
    await api.post('/api/testing/deleteAll')
    await registerUser(user1)
    await registerUser(testuser1)
    await registerUser(testuser2)
    await registerUser(testuser3)

    user1Token = await login(user1.username, user1.password)
    testuser1Token = await login(testuser1.username, testuser1.password)
    testuser2Token = await login(testuser2.username, testuser2.password)
    testuser3Token = await login(testuser3.username, testuser3.password)
})

describe('Test create apartment', () => {
    test('Get current apartment should return null', async () => {
        const response = await api
            .get('/api/apartment')
            .set('Authorization', 'Bearer ' + user1Token)
            .expect(200)
        expect(response.body.data).toBeNull()
    })

    test('Create new apartment', async () => {
        await api
            .post('/api/apartment')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({})
            .expect(400)

        const response = await api
            .post('/api/apartment')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({ name: apartmentName })
            .expect(201)
        expect(response.body.data.name).toEqual(apartmentName)
        expect(typeof response.body.data.id).toBe('number')

        const savedApartment = await aprtmentModel.find({
            id: response.body.data.id,
        })
        const savedAccount = await accountModel.findDisplayAccount({
            id: savedApartment.adminId,
        })

        expect(savedAccount.name).toBe(user1.name)
        expect(savedApartment.name).toBe(apartmentName)
    })
})

describe('Test send invitation', () => {
    test('Create invitation with missing information', async () => {
        await api
            .post('/api/invitation')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({})
            .expect(400)
    })
    test('Create invitation with none existing username', async () => {
        await api
            .post('/api/invitation')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({ username: 'nonexistingusername' })
            .expect(404)
    })
    test('Create invitation when you dont belong to any apartments', async () => {
        await api
            .post('/api/invitation')
            .set('Authorization', 'Bearer ' + testuser1Token)
            .send({ username: 'anhtumai' })
            .expect(404)
    })
    test('Create valid invitation for testuser1', async () => {
        const response = await api
            .post('/api/invitation')
            .set('Authorization', 'Bearer ' + user1Token)
            .send({ username: testuser1.username })
            .expect(201)
        expect(response.body.invitor.username).toBe(user1.username)

        const invitationId = response.body.id
        const invitation = await invitationModel.find({ id: invitationId })
        expect(invitation.invitee.username).toEqual(testuser1.username)
    })
})

describe('Test reject invitation', () => {
    let rejectedInvitation: PendingInvitation
    test('testuse get all invitations', async () => {
        const pendingInvitations = await getAllInvitations(testuser1Token)
        expect(pendingInvitations).toHaveLength(1)

        rejectedInvitation = pendingInvitations[0]
    })

    test('reject invitation to another personal should return 403', async () => {
        await api
            .post(`/api/invitation/${rejectedInvitation.id}/reject`)
            .set('Authorization', 'Bearer ' + user1Token)
            .expect(403)
    })
    test('reject valid invitation', async () => {
        await api
            .post(`/api/invitation/${rejectedInvitation.id}/reject`)
            .set('Authorization', 'Bearer ' + testuser1Token)
            .expect(200)

        const checkedInvitation = await invitationModel.find({
            id: rejectedInvitation.id,
        })
        expect(checkedInvitation).toBeNull()
    })
})

describe('Test accept connection', () => {
    let testuser1Invitation: PendingInvitation
    let testuser2Invitation: PendingInvitation
    let testuser3Invitation: PendingInvitation
    test('Send invitations to all test users', async () => {
        testuser1Invitation = await sendInvitation(user1Token, testuser1.username)
        testuser2Invitation = await sendInvitation(user1Token, testuser2.username)
        testuser3Invitation = await sendInvitation(user1Token, testuser3.username)
    })
    test('Accept invitation for other person', async () => {
        await api
            .post(`/api/invitation/${testuser1Invitation.id}/accept`)
            .set('Authorization', 'Bearer ' + testuser2Token)
            .expect(403)
    })
    test('Accept valid invitation', async () => {
        await api
            .post(`/api/invitation/${testuser1Invitation.id}/accept`)
            .set('Authorization', 'Bearer ' + testuser1Token)
            .expect(200)

        const testUser1Id = testuser1Invitation.invitee.id
        const apartmentId = testuser1Invitation.apartment.id
        const isTestuse1Member = await membershipModel.isMemberOfApartment(
            testUser1Id,
            apartmentId,
        )
        expect(isTestuse1Member).toBeTruthy()

        const afterAcceptInvitation = await invitationModel.find({
            id: testuser1Invitation.id,
        })
        expect(afterAcceptInvitation).toBeNull()
    })
    test('All invitations to an invitee will be deleted if he accepts an invitation', async () => {
        const secondTestuser2Invitation = await sendInvitation(
            testuser1Token,
            testuser2.username,
        )
        await api
            .post(`/api/invitation/${secondTestuser2Invitation.id}/accept`)
            .set('Authorization', 'Bearer ' + testuser2Token)
            .expect(200)
        const afterAcceptInvitation = await invitationModel.find({
            id: testuser1Invitation.id,
        })
        expect(afterAcceptInvitation).toBeNull()
    })
})

afterAll(async () => {
    await prisma.$disconnect()
})
