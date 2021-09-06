# API Documentation

> Will move to Postman or Swagger after finnishing the layout of the project

## Login

`/api/login` - **POST**

- Perform login with username and password
  Get a bearer token after successful login

- Params: `username`, `password`
- Returns:
  - 200, `token`
  - 400, `error`

## Register

`/api/register` - **POST**

- Add new user record
- Params: `username`, `name`, `password`
- Returns:
  - code 201, `username`, `name`, `id`, `createdAt`
  - code 400, `error`

## Apartments

`/api/apartment` - **POST**

- Add new apartment
- Authorization: `token`
- Params: `name`
- Returns:
  - code 201, `name`, `id`, `adminUsername`
  - code 400, `error`

`/api/apartment` - **GET**

- Get apartment the person currently lives in
- Authorization: `token`
- Returns:
  - code 200, `name`, `id`, `adminUsername`
  - code 404; {}
  - code 40N, `error`

## Invite

`/api/invite` - **GET**

- Get all pending invitations
- Authorization: `token`
- Returns:
  - code 200, array of `id`, `apartmentName`, `invitorUsername`
  - code 40N, `error`

`/api/invite` - **POST**

- Invite other users to join your apartment
- Authorization: `token`
- Params: `apartmentId`, `inviteeUsername`
- Returns:
  - code 200, `invitorUsername`, `inviteeUsername`, `apartmentId`
  - code 40N, `error`

`/api/invite/{id}/reject` - **POST**

- Reject invitation
- Authorization: `token`
- Returns:
  - code 200, {}
  - code 40N, `error`

`/api/invite/{id}/accept` - **POST**

- Accept invitation
- Authorization: `token`
- Returns:
  - code 200, {}
  - code 40N, `error`
