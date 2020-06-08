const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneId, userOne, setupDatabase}  = require('./fixtures/db')


beforeEach(setupDatabase)


test('Should sign up a new user', async () => {
    const response = await request(app)
    .post('/users')
    .send({
        name: 'Asa',
        email: 'asafurman@furak.xyz',
        password: 'buttes123B'
    }).expect(201)

    // Assert that database was changed correctly 
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    //Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Asa',
            email: 'asafurman@furak.xyz'
        },
        token: user.tokens[0].token
    })
})

test('Should log in existing user', async() => {
    const response = await request(app)
    .post('/users/login')
    .send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    //Validate that new token from log in is correctly saved to the database
    const user = await User.findById(userOneId)
    expect(user).not.toBeNull()

    expect(response.body).toMatchObject({
        token: user.tokens[1].token
    })
})

test('Should fail to log in nonexistent user', async() => {
    await request(app)
        .post('/users/login')
        .send({
            email: 'lucas2@furak.xyz',
            password: 'ABCXYZ2'
        }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    
    //Verify that user no longer exists in database
    const user = await User.findById(userOne._id)
    expect(user).toBeNull()
})

test('Should fail to delete account for unauthenticated user', async () => {
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update users name', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Hannah'
        })
        .expect(200)
    
    //Confirm that name is updated
    const user = await User.findById(userOneId)
    expect(user.name).toBe('Hannah')
})

test('Should fail to update property which does not exist', async() => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Hannah'
        })
        .expect(400)
})